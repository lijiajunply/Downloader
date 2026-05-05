namespace Downloader.WebApi.Storage;

public interface IFileStorage
{
    Task<StoredFileResult> UploadAsync(string category, IFormFile file, string fallbackName,
        CancellationToken cancellationToken = default);

    Task<StoredFileDownloadResult> DownloadAsync(string storageKey, CancellationToken cancellationToken = default);

    Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default);
}
