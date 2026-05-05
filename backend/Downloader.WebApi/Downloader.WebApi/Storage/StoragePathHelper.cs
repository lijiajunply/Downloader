namespace Downloader.WebApi.Storage;

internal static class StoragePathHelper
{
    private static readonly Dictionary<string, string> ContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".apk"] = "application/vnd.android.package-archive",
        [".ipa"] = "application/octet-stream",
        [".msix"] = "application/msix",
        [".exe"] = "application/vnd.microsoft.portable-executable",
        [".dmg"] = "application/x-apple-diskimage",
        [".pkg"] = "application/octet-stream",
        [".zip"] = "application/zip",
        [".7z"] = "application/x-7z-compressed",
        [".tar"] = "application/x-tar",
        [".gz"] = "application/gzip",
        [".png"] = "image/png",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".gif"] = "image/gif",
        [".webp"] = "image/webp",
        [".svg"] = "image/svg+xml"
    };

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

    public static string GetContentType(string path)
    {
        var extension = Path.GetExtension(path);
        return !string.IsNullOrWhiteSpace(extension) && ContentTypes.TryGetValue(extension, out var contentType)
            ? contentType
            : "application/octet-stream";
    }
}
