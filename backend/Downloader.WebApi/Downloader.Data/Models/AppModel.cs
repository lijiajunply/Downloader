using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Downloader.Data.Models;

/// <summary>
/// App应用
/// </summary>
[Table("apps")]
public class AppModel
{
    [Key] [MaxLength(64)] public string Id { get; set; } = Guid.NewGuid().ToString();
    [MaxLength(64)] public string Name { get; set; } = "";
    [MaxLength(512)] public string Description { get; set; } = "";

    public bool IsActive { get; set; } = true;
    public List<ReleaseModel> Releases { get; set; } = [];

    public List<ProtocolModel> Protocols { get; set; } = [];

    [MaxLength(64)]
    public string UserId { get; set; } = "";

    public UserModel User { get; set; } = null!;
}
