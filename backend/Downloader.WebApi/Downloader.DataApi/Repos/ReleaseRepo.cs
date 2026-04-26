using Downloader.Data;
using Downloader.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Downloader.DataApi.Repos;

public interface IReleaseRepo
{
    Task<List<ReleaseModel>> GetAllAsync();
    Task<ReleaseModel?> GetByIdAsync(string id);
    Task<ReleaseModel> CreateAsync(ReleaseModel release);
    Task<bool> UpdateAsync(ReleaseModel release);
    Task<bool> DeleteAsync(string id);
}

public class ReleaseRepo(IDbContextFactory<DownloaderContext> contextFactory) : IReleaseRepo
{
    public async Task<List<ReleaseModel>> GetAllAsync()
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.Releases.ToListAsync();
    }

    public async Task<ReleaseModel?> GetByIdAsync(string id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.Releases.FindAsync(id);
    }

    public async Task<ReleaseModel> CreateAsync(ReleaseModel release)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        context.Releases.Add(release);
        await context.SaveChangesAsync();
        return release;
    }

    public async Task<bool> UpdateAsync(ReleaseModel release)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        context.Releases.Update(release);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        var release = await context.Releases.FindAsync(id);
        if (release == null) return false;

        context.Releases.Remove(release);
        await context.SaveChangesAsync();
        return true;
    }
}