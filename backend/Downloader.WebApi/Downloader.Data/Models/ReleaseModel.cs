using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Downloader.Data.Models;

/// <summary>
/// 发行版
/// </summary>
[Table("releases")]
public class ReleaseModel
{
    [Key] [MaxLength(64)] public string Id { get; set; } = Guid.NewGuid().ToString();
    [MaxLength(64)] public string Name { get; set; } = "";
    [MaxLength(512)] public string Description { get; set; } = "";
    public DateTime ReleaseDate { get; set; }

    /// <summary>
    /// 版本号
    /// </summary>
    [MaxLength(64)]
    public string ReleaseId { get; set; } = "";

    [MaxLength(64)]
    public string AppModelId { get; set; } = "";

    public AppModel AppModel { get; set; } = null!;
    public List<SoftModel> SoftModels { get; set; } = [];
}
