using Downloader.Data;
using Downloader.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Downloader.DataApi.Repos;

public interface IChannelRepo
{
    Task<List<ChannelModel>> GetAllAsync();
    Task<ChannelModel?> GetByIdAsync(string id);
    Task<ChannelModel> CreateAsync(ChannelModel channel);
    Task<bool> UpdateAsync(ChannelModel channel);
    Task<bool> DeleteAsync(string id);
}

public class ChannelRepo(IDbContextFactory<DownloaderContext> contextFactory) : IChannelRepo
{
    public async Task<List<ChannelModel>> GetAllAsync()
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.Channels.ToListAsync();
    }

    public async Task<ChannelModel?> GetByIdAsync(string id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.Channels.FindAsync(id);
    }

    public async Task<ChannelModel> CreateAsync(ChannelModel channel)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        context.Channels.Add(channel);
        await context.SaveChangesAsync();
        return channel;
    }

    public async Task<bool> UpdateAsync(ChannelModel channel)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        context.Channels.Update(channel);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        var channel = await context.Channels.FindAsync(id);
        if (channel == null) return false;

        context.Channels.Remove(channel);
        await context.SaveChangesAsync();
        return true;
    }
}