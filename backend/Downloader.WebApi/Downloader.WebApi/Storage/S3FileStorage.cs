using Amazon.S3;
using Amazon.S3.Model;

namespace Downloader.WebApi.Storage;

public sealed class S3FileStorage(FileStorageOptions options) : IFileStorage
{
    private readonly S3StorageOptions _s3Options = options.S3;
    private readonly string _proxyBaseUrl = options.PublicBaseUrl;

    public async Task<StoredFileResult> UploadAsync(string category, IFormFile file, string fallbackName,
        CancellationToken cancellationToken = default)
    {
        ValidateOptions();

        var storedFileName = StoragePathHelper.BuildStoredFileName(file.FileName, fallbackName);
        var relativePath = StoragePathHelper.BuildRelativePath(category, storedFileName);
        var storageKey = BuildObjectKey(relativePath);
        var request = new PutObjectRequest
        {
            BucketName = _s3Options.Bucket,
            Key = storageKey,
            InputStream = file.OpenReadStream(),
            AutoCloseStream = true
        };

        if (UsesR2Compatibility())
        {
            request.DisablePayloadSigning = true;
            request.DisableDefaultChecksumValidation = true;
        }

        if (!string.IsNullOrWhiteSpace(file.ContentType))
        {
            request.ContentType = file.ContentType;
        }

        using var client = CreateClient();
        await client.PutObjectAsync(request, cancellationToken);

        return new StoredFileResult(storageKey, BuildPublicUrl(relativePath));
    }

    public async Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        ValidateOptions();

        using var client = CreateClient();

        try
        {
            await client.DeleteObjectAsync(_s3Options.Bucket, StoragePathHelper.NormalizeStorageKey(storageKey),
                cancellationToken);
        }
        catch (AmazonS3Exception exception) when (exception.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
        }
    }

    public async Task<StoredFileDownloadResult> DownloadAsync(string storageKey,
        CancellationToken cancellationToken = default)
    {
        ValidateOptions();

        var normalizedKey = StoragePathHelper.NormalizeStorageKey(storageKey);
        using var client = CreateClient();
        var response = await client.GetObjectAsync(_s3Options.Bucket, normalizedKey, cancellationToken);
        var contentType = string.IsNullOrWhiteSpace(response.Headers.ContentType)
            ? StoragePathHelper.GetContentType(normalizedKey)
            : response.Headers.ContentType;
        var fileName = Path.GetFileName(normalizedKey);
        return new StoredFileDownloadResult(
            new DisposableStream(response.ResponseStream, response),
            contentType,
            fileName);
    }

    private AmazonS3Client CreateClient()
    {
        var config = new AmazonS3Config
        {
            ForcePathStyle = _s3Options.ForcePathStyle || UsesR2Compatibility()
        };

        if (!string.IsNullOrWhiteSpace(_s3Options.ServiceUrl))
        {
            config.ServiceURL = _s3Options.ServiceUrl;
        }
        else if (!string.IsNullOrWhiteSpace(_s3Options.Region))
        {
            config.ServiceURL = $"https://cos.{_s3Options.Region}.myqcloud.com";
        }

        return new AmazonS3Client(_s3Options.AccessKey, _s3Options.SecretKey, config);
    }

    private string BuildObjectKey(string relativePath)
    {
        var normalizedRelativePath = StoragePathHelper.NormalizeStorageKey(relativePath);
        var trimmedPrefix = StoragePathHelper.NormalizeStorageKey(_s3Options.KeyPrefix);

        return string.IsNullOrWhiteSpace(trimmedPrefix)
            ? normalizedRelativePath
            : $"{trimmedPrefix}/{normalizedRelativePath}";
    }

    private string BuildPublicUrl(string relativePath)
    {
        if (!string.IsNullOrWhiteSpace(_s3Options.PublicBaseUrl))
        {
            return StoragePathHelper.BuildPublicUrl(_s3Options.PublicBaseUrl, BuildObjectKey(relativePath));
        }

        if (!string.IsNullOrWhiteSpace(_proxyBaseUrl))
        {
            return StoragePathHelper.BuildPublicUrl($"{_proxyBaseUrl.TrimEnd('/')}/files", BuildObjectKey(relativePath));
        }

        if (!string.IsNullOrWhiteSpace(_s3Options.ServiceUrl))
        {
            throw new InvalidOperationException(
                "Storage:PublicBaseUrl or Storage:S3:PublicBaseUrl must be configured when using a custom S3 ServiceUrl such as Cloudflare R2.");
        }

        if (string.IsNullOrWhiteSpace(_s3Options.Bucket) || string.IsNullOrWhiteSpace(_s3Options.Region))
        {
            throw new InvalidOperationException(
                "Storage:S3:PublicBaseUrl or the combination of Bucket and Region must be configured.");
        }

        var bucketBaseUrl = $"https://{_s3Options.Bucket}.cos.{_s3Options.Region}.myqcloud.com";
        return StoragePathHelper.BuildPublicUrl(bucketBaseUrl, BuildObjectKey(relativePath));
    }

    private void ValidateOptions()
    {
        if (string.IsNullOrWhiteSpace(_s3Options.AccessKey) ||
            string.IsNullOrWhiteSpace(_s3Options.SecretKey) ||
            string.IsNullOrWhiteSpace(_s3Options.Bucket))
        {
            throw new InvalidOperationException(
                "S3 storage is enabled, but Storage:S3:AccessKey, Storage:S3:SecretKey, or Storage:S3:Bucket is missing.");
        }

        if (string.IsNullOrWhiteSpace(_s3Options.ServiceUrl) && string.IsNullOrWhiteSpace(_s3Options.Region))
        {
            throw new InvalidOperationException(
                "S3 storage is enabled, but neither Storage:S3:ServiceUrl nor Storage:S3:Region is configured.");
        }
    }

    private bool UsesR2Compatibility()
    {
        return !string.IsNullOrWhiteSpace(_s3Options.ServiceUrl) &&
               _s3Options.ServiceUrl.Contains(".r2.cloudflarestorage.com", StringComparison.OrdinalIgnoreCase);
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
