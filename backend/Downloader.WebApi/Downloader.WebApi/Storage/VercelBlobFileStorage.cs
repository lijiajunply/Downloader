using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace Downloader.WebApi.Storage;

public sealed class VercelBlobFileStorage(HttpClient httpClient, FileStorageOptions options, ILogger<VercelBlobFileStorage> logger) : IFileStorage
{
    private const string BlobApiVersion = "12";
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly VercelBlobStorageOptions _blobOptions = options.VercelBlob;

    public async Task<StoredFileResult> UploadAsync(string category, IFormFile file, string fallbackName,
        CancellationToken cancellationToken = default)
    {
        ValidateOptions();

        var storedFileName = StoragePathHelper.BuildStoredFileName(file.FileName, fallbackName);
        var pathname = StoragePathHelper.BuildRelativePath(category, storedFileName);
        var requestUri = BuildUploadUri(pathname);
        
        await using var fileStream = file.OpenReadStream();
        using var content = new StreamContent(fileStream);
        content.Headers.ContentLength = file.Length;

        if (!string.IsNullOrWhiteSpace(file.ContentType))
        {
            content.Headers.ContentType = MediaTypeHeaderValue.Parse(file.ContentType);
        }

        using var request = new HttpRequestMessage(HttpMethod.Put, requestUri)
        {
            Content = content
        };

        ApplyBlobHeaders(request, file);

        HttpResponseMessage response;
        try
        {
            response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            var timeoutDescription = _blobOptions.TimeoutMinutes > 0
                ? $"{_blobOptions.TimeoutMinutes} minute(s)"
                : "an infinite timeout";

            throw new InvalidOperationException(
                $"Vercel Blob upload timed out after {timeoutDescription}. File size: {file.Length} bytes. " +
                "Consider increasing Storage:VercelBlob:TimeoutMinutes or switching to multipart upload for large files.",
                exception);
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                throw await CreateExceptionAsync("upload", response, cancellationToken);
            }

            var blob = await response.Content.ReadFromJsonAsync<VercelBlobPutResponse>(JsonOptions, cancellationToken);
            if (blob == null || string.IsNullOrWhiteSpace(blob.Url) || string.IsNullOrWhiteSpace(blob.Pathname))
            {
                throw new InvalidOperationException("Vercel Blob upload succeeded but returned an invalid payload.");
            }

            return new StoredFileResult(blob.Pathname, blob.Url);
        }
    }

    public async Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        ValidateOptions();

        var normalizedKey = StoragePathHelper.NormalizeStorageKey(storageKey);
        var deleteValues = new[] { normalizedKey };

        using var request = new HttpRequestMessage(HttpMethod.Post, BuildDeleteUri())
        {
            Content = JsonContent.Create(new { urls = deleteValues })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _blobOptions.Token);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw await CreateExceptionAsync("delete", response, cancellationToken);
        }
    }

    public async Task<StoredFileDownloadResult> DownloadAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        ValidateOptions();

        var normalizedKey = StoragePathHelper.NormalizeStorageKey(storageKey);
        using var request = new HttpRequestMessage(HttpMethod.Get, BuildBlobReadUri(normalizedKey));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _blobOptions.Token);

        var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            response.Dispose();
            throw new FileNotFoundException("The requested blob does not exist.", normalizedKey);
        }

        if (!response.IsSuccessStatusCode)
        {
            throw await CreateExceptionAsync("download", response, cancellationToken);
        }

        var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? StoragePathHelper.GetContentType(normalizedKey);
        var fileName = Path.GetFileName(normalizedKey);
        return new StoredFileDownloadResult(new DisposableStream(stream, response), contentType, fileName);
    }

    private void ApplyBlobHeaders(HttpRequestMessage request, IFormFile file)
    {
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _blobOptions.Token);
        request.Headers.Add("x-api-version", BlobApiVersion);
        request.Headers.Add("x-vercel-blob-access", _blobOptions.Access);
        request.Headers.Add("x-add-random-suffix", _blobOptions.AddRandomSuffix ? "1" : "0");
        request.Headers.Add("x-allow-overwrite", _blobOptions.AllowOverwrite ? "1" : "0");

        if (file.Length > 0)
        {
            request.Headers.Add("x-content-length", file.Length.ToString());
        }

        if (_blobOptions.CacheControlMaxAge is > 0)
        {
            request.Headers.Add("x-cache-control-max-age", _blobOptions.CacheControlMaxAge.Value.ToString());
        }
    }

    private string BuildUploadUri(string pathname)
    {
        return $"{_blobOptions.ApiUrl.TrimEnd('/')}/?pathname={Uri.EscapeDataString(pathname)}";
    }

    private string BuildDeleteUri()
    {
        return $"{_blobOptions.ApiUrl.TrimEnd('/')}/delete";
    }

    private string BuildBlobReadUri(string pathname)
    {
        var storeId = GetStoreId();
        var access = string.Equals(_blobOptions.Access, "private", StringComparison.OrdinalIgnoreCase)
            ? "private"
            : "public";
        var encodedSegments = pathname.Split('/', StringSplitOptions.RemoveEmptyEntries)
            .Select(Uri.EscapeDataString);

        return $"https://{storeId}.{access}.blob.vercel-storage.com/{string.Join("/", encodedSegments)}";
    }

    private string GetStoreId()
    {
        var segments = _blobOptions.Token.Split('_', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length >= 4 && !string.IsNullOrWhiteSpace(segments[3]))
        {
            return segments[3];
        }

        throw new InvalidOperationException("Invalid Vercel Blob token: unable to extract store ID.");
    }

    private void ValidateOptions()
    {
        if (string.IsNullOrWhiteSpace(_blobOptions.Token))
        {
            throw new InvalidOperationException(
                "Vercel Blob storage is enabled, but Storage:VercelBlob:Token or BLOB_READ_WRITE_TOKEN is missing.");
        }

        if (string.IsNullOrWhiteSpace(_blobOptions.ApiUrl))
        {
            throw new InvalidOperationException("Vercel Blob storage is enabled, but Storage:VercelBlob:ApiUrl is missing.");
        }
    }

    private static async Task<InvalidOperationException> CreateExceptionAsync(string operation, HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        try
        {
            var error = JsonSerializer.Deserialize<VercelBlobErrorEnvelope>(body, JsonOptions);
            if (!string.IsNullOrWhiteSpace(error?.Error?.Message))
            {
                return new InvalidOperationException(
                    $"Vercel Blob {operation} failed with status {(int)response.StatusCode}: {error.Error.Message}");
            }
        }
        catch (JsonException)
        {
        }

        return new InvalidOperationException(
            $"Vercel Blob {operation} failed with status {(int)response.StatusCode}: {body}");
    }

    private sealed class VercelBlobPutResponse
    {
        public string Url { get; set; } = "";
        public string Pathname { get; set; } = "";
    }

    private sealed class VercelBlobErrorEnvelope
    {
        public VercelBlobError? Error { get; set; }
    }

    private sealed class VercelBlobError
    {
        public string Message { get; set; } = "";
    }

    private sealed class DisposableStream(Stream innerStream, IDisposable owner) : Stream
    {
        public override bool CanRead => innerStream.CanRead;
        public override bool CanSeek => innerStream.CanSeek;
        public override bool CanWrite => innerStream.CanWrite;
        public override long Length => innerStream.Length;
        public override long Position
        {
            get => innerStream.Position;
            set => innerStream.Position = value;
        }

        public override void Flush() => innerStream.Flush();
        public override int Read(byte[] buffer, int offset, int count) => innerStream.Read(buffer, offset, count);
        public override long Seek(long offset, SeekOrigin origin) => innerStream.Seek(offset, origin);
        public override void SetLength(long value) => innerStream.SetLength(value);
        public override void Write(byte[] buffer, int offset, int count) => innerStream.Write(buffer, offset, count);
        public override ValueTask DisposeAsync()
        {
            owner.Dispose();
            return ValueTask.CompletedTask;
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                owner.Dispose();
            }

            base.Dispose(disposing);
        }

        public override int Read(Span<byte> buffer) => innerStream.Read(buffer);
        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default) =>
            innerStream.ReadAsync(buffer, cancellationToken);
        public override Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken) =>
            innerStream.ReadAsync(buffer, offset, count, cancellationToken);
        public override Task WriteAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken) =>
            innerStream.WriteAsync(buffer, offset, count, cancellationToken);
        public override ValueTask WriteAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken = default) =>
            innerStream.WriteAsync(buffer, cancellationToken);
    }
}
