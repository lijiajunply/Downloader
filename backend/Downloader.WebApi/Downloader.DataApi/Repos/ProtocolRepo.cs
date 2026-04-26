using Downloader.Data;
using Downloader.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Downloader.DataApi.Repos;

public interface IProtocolRepo
{
    Task<List<ProtocolModel>> GetAllAsync();
    Task<ProtocolModel?> GetByIdAsync(string id);
    Task<ProtocolModel> CreateAsync(ProtocolModel protocol);
    Task<bool> UpdateAsync(ProtocolModel protocol);
    Task<bool> DeleteAsync(string id);
}

public class ProtocolRepo(IDbContextFactory<DownloaderContext> contextFactory) : IProtocolRepo
{
    public async Task<List<ProtocolModel>> GetAllAsync()
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.Protocols.ToListAsync();
    }

    public async Task<ProtocolModel?> GetByIdAsync(string id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.Protocols.FindAsync(id);
    }

    public async Task<ProtocolModel> CreateAsync(ProtocolModel protocol)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        context.Protocols.Add(protocol);
        await context.SaveChangesAsync();
        return protocol;
    }

    public async Task<bool> UpdateAsync(ProtocolModel protocol)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        context.Protocols.Update(protocol);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        var protocol = await context.Protocols.FindAsync(id);
        if (protocol == null) return false;

        context.Protocols.Remove(protocol);
        await context.SaveChangesAsync();
        return true;
    }
}