using Downloader.Data.DTOs;
using Downloader.DataApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Downloader.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppController(IAppService appService) : ControllerBase
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
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var success = await appService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}
