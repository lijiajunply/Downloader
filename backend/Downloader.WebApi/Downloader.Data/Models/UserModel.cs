using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Downloader.Data.Models;

[Table("users")]
public class UserModel
{
    [Key]
    [MaxLength(64)]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [MaxLength(64)]
    public string Username { get; set; } = "";
    
    /// <summary>
    /// 记录密码的加密值
    /// </summary>
    [MaxLength(64)]
    public string Password { get; set; } = "";
    [MaxLength(128)]
    public string Email { get; set; } = "";
    public bool EmailConfirmed { get; set; }
    
    /// <summary>
    /// 身份信息
    /// </summary>
    [MaxLength(32)]
    public string Identity { get; set; } = "";

    /// <summary>
    /// 上传的 App
    /// </summary>
    public List<AppModel> Apps { get; set; } = [];
}