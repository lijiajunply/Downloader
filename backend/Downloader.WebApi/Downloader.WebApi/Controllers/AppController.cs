using Downloader.Data.DTOs;
using Downloader.DataApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Downloader.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppController(IAppService appService, IWebHostEnvironment environment) : ControllerBase
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

        var storedFileName = BuildStoredFileName(request.File.FileName);
        var uploadRoot = Path.Combine(GetWebRootPath(), "uploads", "app-icons");
        Directory.CreateDirectory(uploadRoot);

        var filePath = Path.Combine(uploadRoot, storedFileName);
        await using (var stream = System.IO.File.Create(filePath))
        {
            await request.File.CopyToAsync(stream);
        }

        var success = await appService.UpdateIconAsync(id, BuildPublicIconUrl(storedFileName));
        if (success)
        {
            var app = await appService.GetByIdAsync(id);
            return app == null ? NotFound() : Ok(app);
        }

        System.IO.File.Delete(filePath);
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

    private string GetWebRootPath()
    {
        if (!string.IsNullOrWhiteSpace(environment.WebRootPath))
        {
            return environment.WebRootPath;
        }

        return Path.Combine(environment.ContentRootPath, "wwwroot");
    }

    private static string BuildStoredFileName(string fileName)
    {
        var originalFileName = Path.GetFileName(fileName);
        var name = Path.GetFileNameWithoutExtension(originalFileName);
        var extension = Path.GetExtension(originalFileName);
        var safeName = string.Join("_", name.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));

        if (string.IsNullOrWhiteSpace(safeName))
        {
            safeName = "app-icon";
        }

        if (safeName.Length > 80)
        {
            safeName = safeName[..80];
        }

        return $"{DateTimeOffset.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}-{safeName}{extension}";
    }

    private string BuildPublicIconUrl(string storedFileName)
    {
        var encodedFileName = Uri.EscapeDataString(storedFileName);
        return $"{Request.Scheme}://{Request.Host}/uploads/app-icons/{encodedFileName}";
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
