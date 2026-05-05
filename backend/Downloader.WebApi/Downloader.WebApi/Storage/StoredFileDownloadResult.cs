namespace Downloader.WebApi.Storage;

public sealed record StoredFileDownloadResult(Stream Stream, string ContentType, string FileName);
