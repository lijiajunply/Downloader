using Downloader.Data;
using Downloader.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace Downloader.DataApi.Repos;

public interface IUserRepo
{
    Task<List<UserModel>> GetAllAsync();
    Task<UserModel?> GetByIdAsync(string id);
    Task<UserModel?> GetByUsernameAsync(string username);
    Task<UserModel> CreateAsync(UserModel user);
    Task<bool> UpdateAsync(UserModel user);
    Task<bool> DeleteAsync(string id);
}

public class UserRepo(IDbContextFactory<DownloaderContext> contextFactory) : IUserRepo
{
    public async Task<List<UserModel>> GetAllAsync()
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.Users.ToListAsync();
    }

    public async Task<UserModel?> GetByIdAsync(string id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.Users.FindAsync(id);
    }

    public async Task<UserModel?> GetByUsernameAsync(string username)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        return await context.Users.FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<UserModel> CreateAsync(UserModel user)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return user;
    }

    public async Task<bool> UpdateAsync(UserModel user)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        context.Users.Update(user);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        await using var context = await contextFactory.CreateDbContextAsync();
        var user = await context.Users.FindAsync(id);
        if (user == null) return false;

        context.Users.Remove(user);
        await context.SaveChangesAsync();
        return true;
    }
}