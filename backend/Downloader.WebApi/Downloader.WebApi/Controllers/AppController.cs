using Downloader.Data.DTOs;
using Downloader.DataApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Downloader.WebApi.Storage;

namespace Downloader.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppController(IAppService appService, IFileStorage fileStorage) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<AppDto>>> GetAll()
    {
        var apps = await appService.GetAllAsync();
        return Ok(apps);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AppDetailDto>> GetById(string id)
    {
        var app = await appService.GetAppDetailAsync(id);
        if (app == null) return NotFound();
        return Ok(app);
    }

    [HttpGet("{id}/latest")]
    public async Task<ActionResult<AppLatestVersionDto>> GetLatestVersion(string id, [FromQuery] string? channelId)
    {
        var version = await appService.GetLatestVersionAsync(id, channelId);
        if (version == null) return NotFound();
        return Ok(version);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<AppDto>> Create([FromBody] AppCreateDto dto)
    {
        var app = await appService.CreateAsync(dto);
        if (app == null) return BadRequest("Could not create app. Invalid UserId?");
        return CreatedAtAction(nameof(GetById), new { id = app.Id }, app);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, [FromBody] AppUpdateDto dto)
    {
        var success = await appService.UpdateAsync(id, dto);
        if (!success) return NotFound();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/icon")]
    [RequestSizeLimit(10_485_760)]
    [RequestFormLimits(MultipartBodyLengthLimit = 10_485_760)]
    public async Task<ActionResult<AppDto>> UploadIcon(string id, [FromForm] AppIconUploadRequest request)
    {
        if (request.File is not { Length: > 0 })
        {
            return BadRequest("Please upload an app icon image.");
        }

        if (!IsSupportedImage(request.File))
        {
            return BadRequest("Only PNG, JPG, JPEG, GIF, WEBP, and SVG images are supported.");
        }

        var storedFile = await fileStorage.UploadAsync("app-icons", request.File, "app-icon", HttpContext.RequestAborted);
        var success = await appService.UpdateIconAsync(id, storedFile.PublicUrl);
        if (success)
        {
            var app = await appService.GetByIdAsync(id);
            return app == null ? NotFound() : Ok(app);
        }

        await fileStorage.DeleteAsync(storedFile.StorageKey, HttpContext.RequestAborted);
        return NotFound();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var success = await appService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    private static bool IsSupportedImage(IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var supportedExtensions = new HashSet<string> { ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg" };
        return supportedExtensions.Contains(extension) && file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase);
    }
}

public class AppIconUploadRequest
{
    public IFormFile? File { get; set; }
}
