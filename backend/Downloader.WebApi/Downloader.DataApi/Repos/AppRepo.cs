using Downloader.Data;
using Downloader.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Downloader.DataApi.Repos;

public interface IAppRepo
{
    Task<List<AppModel>> GetAllAsync();
    Task<AppModel?> GetByIdAsync(string id);
    Task<AppModel?> GetAppWithReleasesAsync(string id);
    Task<ReleaseModel?> GetLatestReleaseAsync(string appId, string? channelId);
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

    public async Task<AppModel?> GetAppWithReleasesAsync(string id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.Apps
            .Include(a => a.Releases)
                .ThenInclude(r => r.SoftModels)
                    .ThenInclude(s => s.Channel)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<ReleaseModel?> GetLatestReleaseAsync(string appId, string? channelId)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        var query = context.Releases
            .Include(r => r.AppModel)
            .Include(r => r.SoftModels)
                .ThenInclude(s => s.Channel)
            .Where(r => r.AppModel.Id == appId);

        if (!string.IsNullOrEmpty(channelId))
        {
            query = query.Where(r => r.SoftModels.Any(s => s.Channel.Id == channelId));
        }

        return await query.OrderByDescending(r => r.ReleaseDate).FirstOrDefaultAsync();
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