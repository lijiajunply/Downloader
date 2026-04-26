using Downloader.Data.DTOs;
using Downloader.DataApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Downloader.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChannelController(IChannelService channelService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ChannelDto>>> GetAll()
    {
        var channels = await channelService.GetAllAsync();
        return Ok(channels);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ChannelDto>> GetById(string id)
    {
        var channel = await channelService.GetByIdAsync(id);
        if (channel == null) return NotFound();
        return Ok(channel);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ChannelDto>> Create([FromBody] ChannelCreateDto dto)
    {
        var channel = await channelService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = channel.Id }, channel);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, [FromBody] ChannelUpdateDto dto)
    {
        var success = await channelService.UpdateAsync(id, dto);
        if (!success) return NotFound();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var success = await channelService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}