using Downloader.Data;
using Downloader.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Downloader.DataApi.Repos;

public interface IAppRepo
{
    Task<List<AppModel>> GetAllAsync();
    Task<AppModel?> GetByIdAsync(string id);
    Task<AppModel> CreateAsync(AppModel app);
    Task<bool> UpdateAsync(AppModel app);
    Task<bool> DeleteAsync(string id);
}

public class AppRepo(IDbContextFactory<DownloaderContext> contextFactory) : IAppRepo
{
    public async Task<List<AppModel>> GetAllAsync()
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.Apps.ToListAsync();
    }

    public async Task<AppModel?> GetByIdAsync(string id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.Apps.FindAsync(id);
    }

    public async Task<AppModel> CreateAsync(AppModel app)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        context.Apps.Add(app);
        await context.SaveChangesAsync();
        return app;
    }

    public async Task<bool> UpdateAsync(AppModel app)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        context.Apps.Update(app);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        var app = await context.Apps.FindAsync(id);
        if (app == null) return false;

        context.Apps.Remove(app);
        await context.SaveChangesAsync();
        return true;
    }
}