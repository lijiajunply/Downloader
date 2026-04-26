using Downloader.Data.DTOs;
using Downloader.Data.Models;
using Downloader.DataApi.Repos;

namespace Downloader.DataApi.Services;

public interface IAppService
{
    Task<List<AppDto>> GetAllAsync();
    Task<AppDto?> GetByIdAsync(string id);
    Task<AppDto?> CreateAsync(AppCreateDto dto);
    Task<bool> UpdateAsync(string id, AppUpdateDto dto);
    Task<bool> DeleteAsync(string id);
}

public class AppService(IAppRepo appRepo, IUserRepo userRepo) : IAppService
{
    public async Task<List<AppDto>> GetAllAsync()
    {
        var apps = await appRepo.GetAllAsync();
        return apps.Select(a => new AppDto
        {
            Id = a.Id,
            Name = a.Name,
            Description = a.Description,
            IsActive = a.IsActive
        }).ToList();
    }

    public async Task<AppDto?> GetByIdAsync(string id)
    {
        var app = await appRepo.GetByIdAsync(id);
        if (app == null) return null;

        return new AppDto
        {
            Id = app.Id,
            Name = app.Name,
            Description = app.Description,
            IsActive = app.IsActive
        };
    }

    public async Task<AppDto?> CreateAsync(AppCreateDto dto)
    {
        var user = await userRepo.GetByIdAsync(dto.UserId);
        if (user == null) return null;

        var app = new AppModel
        {
            Id = Guid.NewGuid().ToString(),
            Name = dto.Name,
            Description = dto.Description,
            IsActive = true,
            User = user
        };

        await appRepo.CreateAsync(app);

        return new AppDto
        {
            Id = app.Id,
            Name = app.Name,
            Description = app.Description,
            IsActive = app.IsActive
        };
    }

    public async Task<bool> UpdateAsync(string id, AppUpdateDto dto)
    {
        var app = await appRepo.GetByIdAsync(id);
        if (app == null) return false;

        app.Name = dto.Name;
        app.Description = dto.Description;
        app.IsActive = dto.IsActive;

        return await appRepo.UpdateAsync(app);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        return await appRepo.DeleteAsync(id);
    }
}