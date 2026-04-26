namespace Downloader.Data.DTOs;

public class SoftDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string SoftUrl { get; set; } = "";
    public string Description { get; set; } = "";
    public ChannelDto? Channel { get; set; }
}

public class SoftCreateDto
{
    public string Name { get; set; } = "";
    public string SoftUrl { get; set; } = "";
    public string Description { get; set; } = "";
    public string ReleaseId { get; set; } = "";
    public string ChannelId { get; set; } = "";
}

public class SoftUpdateDto
{
    public string Name { get; set; } = "";
    public string SoftUrl { get; set; } = "";
    public string Description { get; set; } = "";
}