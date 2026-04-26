using Downloader.Data.DTOs;
using Downloader.DataApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Downloader.WebApi.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class UserController(IUserService userService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        var users = await userService.GetAllAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(string id)
    {
        var user = await userService.GetByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] UserCreateDto dto)
    {
        var user = await userService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(string id, [FromBody] UserUpdateDto dto)
    {
        var success = await userService.UpdateAsync(id, dto);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPut("{id}/reset-password")]
    public async Task<ActionResult> ResetPassword(string id, [FromBody] UserChangePasswordDto dto)
    {
        var success = await userService.ResetPasswordAsync(id, dto);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        var success = await userService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}