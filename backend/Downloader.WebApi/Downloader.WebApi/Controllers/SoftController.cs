using Downloader.Data.DTOs;
using Downloader.DataApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Downloader.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SoftController(ISoftService softService) : ControllerBase
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