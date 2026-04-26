namespace Downloader.Data.DTOs;

public class AppDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public bool IsActive { get; set; }
}

public class AppCreateDto
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string UserId { get; set; } = "";
}

public class AppUpdateDto
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public bool IsActive { get; set; }
}