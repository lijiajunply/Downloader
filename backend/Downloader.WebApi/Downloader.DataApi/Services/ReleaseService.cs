using Downloader.Data.DTOs;
using Downloader.Data.Models;
using Downloader.DataApi.Repos;

namespace Downloader.DataApi.Services;

public interface IReleaseService
{
    Task<List<ReleaseDto>> GetAllAsync();
    Task<ReleaseDto?> GetByIdAsync(string id);
    Task<ReleaseDto?> CreateAsync(ReleaseCreateDto dto);
    Task<bool> UpdateAsync(string id, ReleaseUpdateDto dto);
    Task<bool> DeleteAsync(string id);
}

public class ReleaseService(IReleaseRepo releaseRepo, IAppRepo appRepo) : IReleaseService
{
    public async Task<List<ReleaseDto>> GetAllAsync()
    {
        var releases = await releaseRepo.GetAllAsync();
        return releases.Select(r => new ReleaseDto
        {
            Id = r.Id,
            Name = r.Name,
            Description = r.Description,
            ReleaseDate = r.ReleaseDate,
            ReleaseId = r.ReleaseId
        }).ToList();
    }

    public async Task<ReleaseDto?> GetByIdAsync(string id)
    {
        var release = await releaseRepo.GetByIdAsync(id);
        if (release == null) return null;

        return new ReleaseDto
        {
            Id = release.Id,
            Name = release.Name,
            Description = release.Description,
            ReleaseDate = release.ReleaseDate,
            ReleaseId = release.ReleaseId
        };
    }

    public async Task<ReleaseDto?> CreateAsync(ReleaseCreateDto dto)
    {
        var app = await appRepo.GetByIdAsync(dto.AppId);
        if (app == null) return null;

        var release = new ReleaseModel
        {
            Id = Guid.NewGuid().ToString(),
            Name = dto.Name,
            Description = dto.Description,
            ReleaseId = dto.ReleaseId,
            ReleaseDate = DateTime.UtcNow,
            AppModel = app
        };

        await releaseRepo.CreateAsync(release);

        return new ReleaseDto
        {
            Id = release.Id,
            Name = release.Name,
            Description = release.Description,
            ReleaseDate = release.ReleaseDate,
            ReleaseId = release.ReleaseId
        };
    }

    public async Task<bool> UpdateAsync(string id, ReleaseUpdateDto dto)
    {
        var release = await releaseRepo.GetByIdAsync(id);
        if (release == null) return false;

        release.Name = dto.Name;
        release.Description = dto.Description;
        release.ReleaseId = dto.ReleaseId;

        return await releaseRepo.UpdateAsync(release);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        return await releaseRepo.DeleteAsync(id);
    }
}