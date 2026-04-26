using System;

namespace Downloader.Data.DTOs;

public class ReleaseDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime ReleaseDate { get; set; }
    public string ReleaseId { get; set; } = "";
}

public class ReleaseCreateDto
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string ReleaseId { get; set; } = "";
    public string AppId { get; set; } = "";
}

public class ReleaseUpdateDto
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string ReleaseId { get; set; } = "";
}