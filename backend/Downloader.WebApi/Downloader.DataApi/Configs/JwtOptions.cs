namespace Downloader.DataApi.Configs;

public sealed class JwtOptions
{
    public string SecretKey { get; set; } = "default_secret_key_needs_to_be_at_least_32_characters_long";
    public string Issuer { get; set; } = "DownloaderApp";
    public string Audience { get; set; } = "DownloaderUsers";
    public int ExpireDays { get; set; } = 7;
}
