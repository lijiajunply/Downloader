using Downloader.Data.DTOs;
using Downloader.Data.Models;
using Downloader.DataApi.Repos;

namespace Downloader.DataApi.Services;

public interface ISoftService
{
    Task<List<SoftDto>> GetAllAsync();
    Task<SoftDto?> GetByIdAsync(string id);
    Task<SoftDto?> CreateAsync(SoftCreateDto dto);
    Task<bool> UpdateAsync(string id, SoftUpdateDto dto);
    Task<bool> DeleteAsync(string id);
}

public class SoftService(ISoftRepo softRepo, IReleaseRepo releaseRepo, IChannelRepo channelRepo) : ISoftService
{
    public async Task<List<SoftDto>> GetAllAsync()
    {
        var softs = await softRepo.GetAllAsync();
        return softs.Select(s => new SoftDto
        {
            Id = s.Id,
            Name = s.Name,
            SoftUrl = s.SoftUrl,
            Description = s.Description
        }).ToList();
    }

    public async Task<SoftDto?> GetByIdAsync(string id)
    {
        var soft = await softRepo.GetByIdAsync(id);
        if (soft == null) return null;

        return new SoftDto
        {
            Id = soft.Id,
            Name = soft.Name,
            SoftUrl = soft.SoftUrl,
            Description = soft.Description
        };
    }

    public async Task<SoftDto?> CreateAsync(SoftCreateDto dto)
    {
        var release = await releaseRepo.GetByIdAsync(dto.ReleaseId);
        var channel = await channelRepo.GetByIdAsync(dto.ChannelId);

        if (release == null || channel == null) return null;

        var soft = new SoftModel
        {
            Id = Guid.NewGuid().ToString(),
            Name = dto.Name,
            SoftUrl = dto.SoftUrl,
            Description = dto.Description,
            Release = release,
            Channel = channel
        };

        await softRepo.CreateAsync(soft);

        return new SoftDto
        {
            Id = soft.Id,
            Name = soft.Name,
            SoftUrl = soft.SoftUrl,
            Description = soft.Description
        };
    }

    public async Task<bool> UpdateAsync(string id, SoftUpdateDto dto)
    {
        var soft = await softRepo.GetByIdAsync(id);
        if (soft == null) return false;

        soft.Name = dto.Name;
        soft.SoftUrl = dto.SoftUrl;
        soft.Description = dto.Description;

        return await softRepo.UpdateAsync(soft);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        return await softRepo.DeleteAsync(id);
    }
}