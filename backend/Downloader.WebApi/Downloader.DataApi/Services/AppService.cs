using Downloader.Data.DTOs;
using Downloader.Data.Models;
using Downloader.DataApi.Repos;

namespace Downloader.DataApi.Services;

public interface IAppService
{
    Task<List<AppDto>> GetAllAsync();
    Task<AppDto?> GetByIdAsync(string id);
    Task<AppDetailDto?> GetAppDetailAsync(string id);
    Task<AppLatestVersionDto?> GetLatestVersionAsync(string appId, string? channelId);
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

    public async Task<AppDetailDto?> GetAppDetailAsync(string id)
    {
        var app = await appRepo.GetAppWithReleasesAsync(id);
        if (app == null) return null;

        return new AppDetailDto
        {
            Id = app.Id,
            Name = app.Name,
            Description = app.Description,
            IsActive = app.IsActive,
            Releases = app.Releases.OrderByDescending(r => r.ReleaseDate).Select(r => new ReleaseDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                ReleaseId = r.ReleaseId,
                ReleaseDate = r.ReleaseDate,
                Softs = r.SoftModels.Select(s => new SoftDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Description = s.Description,
                    SoftUrl = s.SoftUrl,
                    Channel = s.Channel != null ? new ChannelDto
                    {
                        Id = s.Channel.Id,
                        Name = s.Channel.Name
                    } : null
                }).ToList()
            }).ToList()
        };
    }

    public async Task<AppLatestVersionDto?> GetLatestVersionAsync(string appId, string? channelId)
    {
        var release = await appRepo.GetLatestReleaseAsync(appId, channelId);
        if (release == null) return null;

        var softs = release.SoftModels;
        if (!string.IsNullOrEmpty(channelId))
        {
            softs = softs.Where(s => s.Channel?.Id == channelId).ToList();
        }

        return new AppLatestVersionDto
        {
            AppId = release.AppModel.Id,
            AppName = release.AppModel.Name,
            ReleaseId = release.ReleaseId,
            ReleaseDate = release.ReleaseDate,
            Softs = softs.Select(s => new SoftDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                SoftUrl = s.SoftUrl,
                Channel = s.Channel != null ? new ChannelDto
                {
                    Id = s.Channel.Id,
                    Name = s.Channel.Name
                } : null
            }).ToList()
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