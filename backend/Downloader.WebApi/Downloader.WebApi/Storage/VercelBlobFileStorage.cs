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
}
