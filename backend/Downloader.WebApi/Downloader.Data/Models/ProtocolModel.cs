using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Downloader.Data.Models;

/// <summary>
/// 用户协议，隐私协议等
/// </summary>
[Table("protocols")]
public class ProtocolModel
{
    [Key] [MaxLength(64)] public string Id { get; set; } = Guid.NewGuid().ToString();
    [MaxLength(64)] public string Name { get; set; } = "";
    [MaxLength(512)] public string Description { get; set; } = "";

    /// <summary>
    /// 协议内容
    /// </summary>
    [MaxLength(512_000)]
    public string Context { get; set; } = "";

    public AppModel App { get; set; } = new();
}