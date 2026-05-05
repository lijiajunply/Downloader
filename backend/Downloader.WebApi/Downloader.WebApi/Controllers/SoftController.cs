using Downloader.Data.DTOs;
using Downloader.DataApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Downloader.WebApi.Storage;

namespace Downloader.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SoftController(ISoftService softService, IFileStorage fileStorage) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<SoftDto>>> GetAll()
    {
        var softs = await softService.GetAllAsync();
        return Ok(softs);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SoftDto>> GetById(string id)
    {
        var soft = await softService.GetByIdAsync(id);
        if (soft == null) return NotFound();
        return Ok(soft);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<SoftDto>> Create([FromBody] SoftCreateDto dto)
    {
        var soft = await softService.CreateAsync(dto);
        if (soft == null) return BadRequest("Could not create soft. Invalid ReleaseId or ChannelId?");
        return CreatedAtAction(nameof(GetById), new { id = soft.Id }, soft);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("upload")]
    [RequestSizeLimit(2_147_483_648)]
    [RequestFormLimits(MultipartBodyLengthLimit = 2_147_483_648)]
    public async Task<ActionResult<SoftDto>> Upload([FromForm] SoftUploadRequest request)
    {
        if (request.File is not { Length: > 0 })
        {
            return BadRequest("Please upload a software package file.");
        }

        var storedFile = await fileStorage.UploadAsync("software", request.File, "package", HttpContext.RequestAborted);

        var soft = await softService.CreateAsync(new SoftCreateDto
        {
            Name = request.Name,
            Description = request.Description,
            ReleaseId = request.ReleaseId,
            ChannelId = request.ChannelId,
            SoftUrl = storedFile.PublicUrl
        });

        if (soft != null) return CreatedAtAction(nameof(GetById), new { id = soft.Id }, soft);

        await fileStorage.DeleteAsync(storedFile.StorageKey, HttpContext.RequestAborted);
        return BadRequest("Could not create soft. Invalid ReleaseId or ChannelId?");
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, [FromBody] SoftUpdateDto dto)
    {
        var success = await softService.UpdateAsync(id, dto);
        if (!success) return NotFound();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var success = await softService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

}

public class SoftUploadRequest
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string ReleaseId { get; set; } = "";
    public string ChannelId { get; set; } = "";
    public IFormFile? File { get; set; }
}
