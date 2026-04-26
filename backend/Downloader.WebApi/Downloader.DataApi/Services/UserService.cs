using Downloader.Data;
using Downloader.Data.DTOs;
using Downloader.Data.Models;
using Downloader.DataApi.Repos;

namespace Downloader.DataApi.Services;

public interface IUserService
{
    Task<List<UserDto>> GetAllAsync();
    Task<UserDto?> GetByIdAsync(string id);
    Task<UserDto> CreateAsync(UserCreateDto dto);
    Task<bool> UpdateAsync(string id, UserUpdateDto dto);
    Task<bool> ResetPasswordAsync(string id, UserChangePasswordDto dto);
    Task<bool> DeleteAsync(string id);
}

public class UserService(IUserRepo userRepo) : IUserService
{
    public async Task<List<UserDto>> GetAllAsync()
    {
        var users = await userRepo.GetAllAsync();
        return users.Select(u => new UserDto
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            EmailConfirmed = u.EmailConfirmed,
            Identity = u.Identity
        }).ToList();
    }

    public async Task<UserDto?> GetByIdAsync(string id)
    {
        var user = await userRepo.GetByIdAsync(id);
        if (user == null) return null;

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            EmailConfirmed = user.EmailConfirmed,
            Identity = user.Identity
        };
    }

    public async Task<UserDto> CreateAsync(UserCreateDto dto)
    {
        var user = new UserModel
        {
            Id = Guid.NewGuid().ToString(),
            Username = dto.Username,
            Password = dto.Password.StringToHash(),
            Email = dto.Email,
            EmailConfirmed = false,
            Identity = "User"
        };

        await userRepo.CreateAsync(user);

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            EmailConfirmed = user.EmailConfirmed,
            Identity = user.Identity
        };
    }

    public async Task<bool> UpdateAsync(string id, UserUpdateDto dto)
    {
        var user = await userRepo.GetByIdAsync(id);
        if (user == null) return false;

        user.Email = dto.Email;
        user.Identity = dto.Identity;

        return await userRepo.UpdateAsync(user);
    }

    public async Task<bool> ResetPasswordAsync(string id, UserChangePasswordDto dto)
    {
        var user = await userRepo.GetByIdAsync(id);
        if (user == null) return false;

        user.Password = dto.NewPassword.StringToHash();

        return await userRepo.UpdateAsync(user);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        return await userRepo.DeleteAsync(id);
    }
}