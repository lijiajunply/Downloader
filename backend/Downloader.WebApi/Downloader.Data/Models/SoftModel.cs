using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Downloader.Data.Models;

/// <summary>
/// 发行版中对应的软件
/// </summary>
[Table("soft")]
public class SoftModel
{
    [Key] [MaxLength(64)] public string Id { get; set; } = Guid.NewGuid().ToString();
    [MaxLength(64)] public string Name { get; set; } = "";

    /// <summary>
    /// 软件所在存储地址
    /// </summary>
    [MaxLength(512)]
    public string SoftUrl { get; set; } = "";

    [MaxLength(64)] public string? Description { get; set; }

    [MaxLength(64)] public string ReleaseId { get; set; } = "";

    public ReleaseModel Release { get; set; } = null!;

    [MaxLength(64)] public string ChannelId { get; set; } = "";

    public ChannelModel Channel { get; set; } = null!;
}
