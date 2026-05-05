namespace Downloader.WebApi.Storage;

internal static class StoragePathHelper
{
    public static string BuildStoredFileName(string fileName, string fallbackName)
    {
        var originalFileName = Path.GetFileName(fileName);
        var name = Path.GetFileNameWithoutExtension(originalFileName);
        var extension = Path.GetExtension(originalFileName);
        var safeName = string.Join("_", name.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));

        if (string.IsNullOrWhiteSpace(safeName))
        {
            safeName = fallbackName;
        }

        if (safeName.Length > 80)
        {
            safeName = safeName[..80];
        }

        return $"{DateTimeOffset.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}-{safeName}{extension}";
    }

    public static string BuildRelativePath(string category, string storedFileName)
    {
        return $"uploads/{category.Trim('/')}/{storedFileName}";
    }

    public static string BuildPublicUrl(string baseUrl, string relativePath)
    {
        var trimmedBaseUrl = baseUrl.Trim().TrimEnd('/');
        var encodedPath = string.Join("/",
            relativePath.Split('/', StringSplitOptions.RemoveEmptyEntries).Select(Uri.EscapeDataString));

        return $"{trimmedBaseUrl}/{encodedPath}";
    }

    public static string NormalizeStorageKey(string storageKey)
    {
        return storageKey.Replace('\\', '/').TrimStart('/');
    }
}
