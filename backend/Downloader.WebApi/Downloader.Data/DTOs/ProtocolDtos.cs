namespace Downloader.Data.DTOs;

public class ProtocolDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Context { get; set; } = "";
}

public class ProtocolCreateDto
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Context { get; set; } = "";
    public string AppId { get; set; } = "";
}

public class ProtocolUpdateDto
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Context { get; set; } = "";
}