using Amazon.S3;
using Amazon.S3.Model;

namespace Downloader.WebApi.Storage;

public sealed class S3FileStorage(FileStorageOptions options) : IFileStorage
{
    private readonly S3StorageOptions _s3Options = options.S3;

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

    private AmazonS3Client CreateClient()
    {
        var config = new AmazonS3Config
        {
            ForcePathStyle = _s3Options.ForcePathStyle
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
}
