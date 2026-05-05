namespace Downloader.WebApi.Storage;

public sealed class FileStorageOptions
{
    public string Provider { get; set; } = "Local";
    public string PublicBaseUrl { get; set; } = "";
    public S3StorageOptions S3 { get; set; } = new();
    public VercelBlobStorageOptions VercelBlob { get; set; } = new();
}

public sealed class S3StorageOptions
{
    public string Bucket { get; set; } = "";
    public string Region { get; set; } = "";
    public string ServiceUrl { get; set; } = "";
    public string PublicBaseUrl { get; set; } = "";
    public string AccessKey { get; set; } = "";
    public string SecretKey { get; set; } = "";
    public string KeyPrefix { get; set; } = "";
    public bool ForcePathStyle { get; set; }
}

public sealed class VercelBlobStorageOptions
{
    public string Token { get; set; } = "";
    public string ApiUrl { get; set; } = "https://vercel.com/api/blob";
    public string Access { get; set; } = "public";
    public int TimeoutMinutes { get; set; } = 30;
    public bool AddRandomSuffix { get; set; }
    public bool AllowOverwrite { get; set; }
    public int? CacheControlMaxAge { get; set; }
}
