namespace Downloader.Data.DTOs;

public class UserDto
{
    public string Id { get; set; } = "";
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public bool EmailConfirmed { get; set; }
    public string Identity { get; set; } = "";
}

public class UserCreateDto
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string Email { get; set; } = "";
}

public class UserUpdateDto
{
    public string Email { get; set; } = "";
    public string Identity { get; set; } = "";
}
public class UserLoginDto
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
}

public class LoginResultDto
{
    public string Token { get; set; } = "";
    public UserDto User { get; set; } = null!;
}

