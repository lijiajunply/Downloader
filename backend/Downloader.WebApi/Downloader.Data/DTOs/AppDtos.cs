namespace Downloader.Data.DTOs;

public class AppDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public bool IsActive { get; set; }
}

public class AppDetailDto : AppDto
{
    public List<ReleaseDto> Releases { get; set; } = [];
    public List<ProtocolDto> Protocols { get; set; } = [];
}

public class AppLatestVersionDto
{
    public string AppId { get; set; } = "";
    public string AppName { get; set; } = "";
    public string ReleaseId { get; set; } = "";
    public DateTime ReleaseDate { get; set; }
    public List<SoftDto> Softs { get; set; } = [];
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
