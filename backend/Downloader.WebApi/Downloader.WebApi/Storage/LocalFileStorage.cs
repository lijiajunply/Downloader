namespace Downloader.WebApi.Storage;

public sealed class LocalFileStorage(
    IWebHostEnvironment environment,
    IHttpContextAccessor httpContextAccessor,
    FileStorageOptions options) : IFileStorage
{
    public async Task<StoredFileResult> UploadAsync(string category, IFormFile file, string fallbackName,
        CancellationToken cancellationToken = default)
    {
        var storedFileName = StoragePathHelper.BuildStoredFileName(file.FileName, fallbackName);
        var relativePath = StoragePathHelper.BuildRelativePath(category, storedFileName);
        var physicalPath = Path.Combine(GetWebRootPath(), relativePath.Replace('/', Path.DirectorySeparatorChar));
        var directory = Path.GetDirectoryName(physicalPath);

        if (string.IsNullOrWhiteSpace(directory))
        {
            throw new InvalidOperationException("Could not resolve the upload directory.");
        }

        Directory.CreateDirectory(directory);

        await using (var stream = System.IO.File.Create(physicalPath))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var publicUrl = StoragePathHelper.BuildPublicUrl(GetPublicBaseUrl(), relativePath);
        return new StoredFileResult(relativePath, publicUrl);
    }

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var normalizedKey = StoragePathHelper.NormalizeStorageKey(storageKey);
        var physicalPath = Path.GetFullPath(Path.Combine(GetWebRootPath(), normalizedKey.Replace('/', Path.DirectorySeparatorChar)));
        var webRootPath = Path.GetFullPath(GetWebRootPath());

        if (!physicalPath.StartsWith(webRootPath, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("The storage key points outside of the configured web root.");
        }

        if (System.IO.File.Exists(physicalPath))
        {
            System.IO.File.Delete(physicalPath);
        }

        return Task.CompletedTask;
    }

    private string GetWebRootPath()
    {
        if (!string.IsNullOrWhiteSpace(environment.WebRootPath))
        {
            return environment.WebRootPath;
        }

        return Path.Combine(environment.ContentRootPath, "wwwroot");
    }

    private string GetPublicBaseUrl()
    {
        if (!string.IsNullOrWhiteSpace(options.PublicBaseUrl))
        {
            return options.PublicBaseUrl;
        }

        var request = httpContextAccessor.HttpContext?.Request;
        if (request != null && request.Host.HasValue)
        {
            return $"{request.Scheme}://{request.Host}";
        }

        throw new InvalidOperationException(
            "Storage:PublicBaseUrl must be configured when no active HTTP request is available.");
    }
}
