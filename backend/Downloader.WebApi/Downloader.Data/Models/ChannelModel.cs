using System.ComponentModel.DataAnnotations;

namespace Downloader.Data.Models;

/// <summary>
/// 软件的渠道
/// </summary>
public class ChannelModel
{
    [Key] [MaxLength(64)] public string Id { get; set; } = Guid.NewGuid().ToString();
    [MaxLength(64)] public string Name { get; set; } = "";
}