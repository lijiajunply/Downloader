using Downloader.Data.DTOs;
using Downloader.DataApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Downloader.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReleaseController(IReleaseService releaseService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ReleaseDto>>> GetAll()
    {
        var releases = await releaseService.GetAllAsync();
        return Ok(releases);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ReleaseDto>> GetById(string id)
    {
        var release = await releaseService.GetByIdAsync(id);
        if (release == null) return NotFound();
        return Ok(release);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ReleaseDto>> Create([FromBody] ReleaseCreateDto dto)
    {
        var release = await releaseService.CreateAsync(dto);
        if (release == null) return BadRequest("Could not create release. Invalid AppId?");
        return CreatedAtAction(nameof(GetById), new { id = release.Id }, release);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, [FromBody] ReleaseUpdateDto dto)
    {
        var success = await releaseService.UpdateAsync(id, dto);
        if (!success) return NotFound();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var success = await releaseService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}