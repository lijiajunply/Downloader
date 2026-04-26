using Downloader.Data.DTOs;
using Downloader.Data.Models;
using Downloader.DataApi.Repos;

namespace Downloader.DataApi.Services;

public interface IChannelService
{
    Task<List<ChannelDto>> GetAllAsync();
    Task<ChannelDto?> GetByIdAsync(string id);
    Task<ChannelDto> CreateAsync(ChannelCreateDto dto);
    Task<bool> UpdateAsync(string id, ChannelUpdateDto dto);
    Task<bool> DeleteAsync(string id);
}

public class ChannelService(IChannelRepo channelRepo) : IChannelService
{
    public async Task<List<ChannelDto>> GetAllAsync()
    {
        var channels = await channelRepo.GetAllAsync();
        return channels.Select(c => new ChannelDto
        {
            Id = c.Id,
            Name = c.Name
        }).ToList();
    }

    public async Task<ChannelDto?> GetByIdAsync(string id)
    {
        var channel = await channelRepo.GetByIdAsync(id);
        if (channel == null) return null;

        return new ChannelDto
        {
            Id = channel.Id,
            Name = channel.Name
        };
    }

    public async Task<ChannelDto> CreateAsync(ChannelCreateDto dto)
    {
        var channel = new ChannelModel
        {
            Id = Guid.NewGuid().ToString(),
            Name = dto.Name
        };

        await channelRepo.CreateAsync(channel);

        return new ChannelDto
        {
            Id = channel.Id,
            Name = channel.Name
        };
    }

    public async Task<bool> UpdateAsync(string id, ChannelUpdateDto dto)
    {
        var channel = await channelRepo.GetByIdAsync(id);
        if (channel == null) return false;

        channel.Name = dto.Name;

        return await channelRepo.UpdateAsync(channel);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        return await channelRepo.DeleteAsync(id);
    }
}