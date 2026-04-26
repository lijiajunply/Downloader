namespace Downloader.Data.DTOs;

public class ChannelDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
}

public class ChannelCreateDto
{
    public string Name { get; set; } = "";
}

public class ChannelUpdateDto
{
    public string Name { get; set; } = "";
}