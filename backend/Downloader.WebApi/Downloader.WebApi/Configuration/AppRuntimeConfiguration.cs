using Downloader.DataApi.Configs;
using Downloader.WebApi.Storage;

namespace Downloader.WebApi.Configuration;

public sealed class AppRuntimeConfiguration
{
    public string? ConnectionString { get; init; }
    public JwtOptions Jwt { get; init; } = new();
    public FileStorageOptions Storage { get; init; } = new();
}

public static class AppRuntimeConfigurationLoader
{
    public static AppRuntimeConfiguration Load(string contentRootPath)
    {
        var envFilePath = Path.Combine(contentRootPath, ".env");
        if (File.Exists(envFilePath))
        {
            DotNetEnv.Env.Load(envFilePath);
        }

        var defaultJwtOptions = new JwtOptions();

        return new AppRuntimeConfiguration
        {
            ConnectionString = GetEnvironmentValue("SQL", "ConnectionStrings__DefaultConnection"),
            Jwt = new JwtOptions
            {
                SecretKey = GetEnvironmentValue("JwtSettings__SecretKey") ?? defaultJwtOptions.SecretKey,
                Issuer = GetEnvironmentValue("JwtSettings__Issuer") ?? defaultJwtOptions.Issuer,
                Audience = GetEnvironmentValue("JwtSettings__Audience") ?? defaultJwtOptions.Audience,
                ExpireDays = GetEnvironmentInt("JwtSettings__ExpireDays", defaultJwtOptions.ExpireDays)
            },
            Storage = new FileStorageOptions
            {
                Provider = GetEnvironmentValue("Storage__Provider") ?? "Local",
                PublicBaseUrl = GetEnvironmentValue("Storage__PublicBaseUrl") ?? "",
                S3 = new S3StorageOptions
                {
                    Bucket = GetEnvironmentValue("Storage__S3__Bucket") ?? "",
                    Region = GetEnvironmentValue("Storage__S3__Region") ?? "",
                    ServiceUrl = GetEnvironmentValue("Storage__S3__ServiceUrl") ?? "",
                    PublicBaseUrl = GetEnvironmentValue("Storage__S3__PublicBaseUrl") ?? "",
                    AccessKey = GetEnvironmentValue("Storage__S3__AccessKey") ?? "",
                    SecretKey = GetEnvironmentValue("Storage__S3__SecretKey") ?? "",
                    KeyPrefix = GetEnvironmentValue("Storage__S3__KeyPrefix") ?? "",
                    ForcePathStyle = GetEnvironmentBool("Storage__S3__ForcePathStyle")
                },
                VercelBlob = new VercelBlobStorageOptions
                {
                    Token = GetEnvironmentValue("Storage__VercelBlob__Token", "BLOB_READ_WRITE_TOKEN") ?? "",
                    ApiUrl = GetEnvironmentValue("Storage__VercelBlob__ApiUrl") ?? "https://vercel.com/api/blob",
                    Access = GetEnvironmentValue("Storage__VercelBlob__Access") ?? "public",
                    TimeoutMinutes = GetEnvironmentInt("Storage__VercelBlob__TimeoutMinutes", 30),
                    AddRandomSuffix = GetEnvironmentBool("Storage__VercelBlob__AddRandomSuffix"),
                    AllowOverwrite = GetEnvironmentBool("Storage__VercelBlob__AllowOverwrite"),
                    CacheControlMaxAge = GetNullableEnvironmentInt("Storage__VercelBlob__CacheControlMaxAge")
                }
            }
        };
    }

    private static string? GetEnvironmentValue(params string[] keys)
    {
        return keys.Select(Environment.GetEnvironmentVariable)
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }

    private static int GetEnvironmentInt(string key, int defaultValue)
    {
        var value = GetEnvironmentValue(key);
        return int.TryParse(value, out var result) ? result : defaultValue;
    }

    private static int? GetNullableEnvironmentInt(string key)
    {
        var value = GetEnvironmentValue(key);
        return int.TryParse(value, out var result) ? result : null;
    }

    private static bool GetEnvironmentBool(string key, bool defaultValue = false)
    {
        var value = GetEnvironmentValue(key);
        if (string.IsNullOrWhiteSpace(value))
        {
            return defaultValue;
        }

        if (bool.TryParse(value, out var boolResult))
        {
            return boolResult;
        }

        return value switch
        {
            "1" => true,
            "0" => false,
            _ => defaultValue
        };
    }
}
