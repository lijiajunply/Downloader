using Downloader.Data;
using Downloader.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Downloader.DataApi.Repos;

public interface ISoftRepo
{
    Task<List<SoftModel>> GetAllAsync();
    Task<SoftModel?> GetByIdAsync(string id);
    Task<SoftModel> CreateAsync(SoftModel soft);
    Task<bool> UpdateAsync(SoftModel soft);
    Task<bool> DeleteAsync(string id);
}

public class SoftRepo(IDbContextFactory<DownloaderContext> contextFactory) : ISoftRepo
{
    public async Task<List<SoftModel>> GetAllAsync()
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.SoftModels.ToListAsync();
    }

    public async Task<SoftModel?> GetByIdAsync(string id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.SoftModels.FindAsync(id);
    }

    public async Task<SoftModel> CreateAsync(SoftModel soft)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        context.SoftModels.Add(soft);
        await context.SaveChangesAsync();
        return soft;
    }

    public async Task<bool> UpdateAsync(SoftModel soft)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        context.SoftModels.Update(soft);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        var soft = await context.SoftModels.FindAsync(id);
        if (soft == null) return false;

        context.SoftModels.Remove(soft);
        await context.SaveChangesAsync();
        return true;
    }
}