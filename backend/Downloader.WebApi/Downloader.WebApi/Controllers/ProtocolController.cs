using Downloader.Data.DTOs;
using Downloader.DataApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Downloader.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProtocolController(IProtocolService protocolService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ProtocolDto>>> GetAll()
    {
        var protocols = await protocolService.GetAllAsync();
        return Ok(protocols);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProtocolDto>> GetById(string id)
    {
        var protocol = await protocolService.GetByIdAsync(id);
        if (protocol == null) return NotFound();
        return Ok(protocol);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<ProtocolDto>> Create([FromBody] ProtocolCreateDto dto)
    {
        var protocol = await protocolService.CreateAsync(dto);
        if (protocol == null) return BadRequest("Could not create protocol. Invalid AppId?");
        return CreatedAtAction(nameof(GetById), new { id = protocol.Id }, protocol);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, [FromBody] ProtocolUpdateDto dto)
    {
        var success = await protocolService.UpdateAsync(id, dto);
        if (!success) return NotFound();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var success = await protocolService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}