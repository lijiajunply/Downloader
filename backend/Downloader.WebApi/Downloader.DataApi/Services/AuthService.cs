using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Downloader.Data;
using Downloader.Data.DTOs;
using Downloader.DataApi.Configs;
using Downloader.DataApi.Repos;
using Microsoft.IdentityModel.Tokens;

namespace Downloader.DataApi.Services;

public interface IAuthService
{
    Task<LoginResultDto?> LoginAsync(UserLoginDto dto);
}

public class AuthService(IUserRepo userRepo, JwtOptions jwtOptions) : IAuthService
{
    public async Task<LoginResultDto?> LoginAsync(UserLoginDto dto)
    {
        var user = await userRepo.GetByUsernameAsync(dto.Username);
        
        // 验证用户和密码
        if (user == null || !DataTool.IsOk(dto.Password, user.Password))
        {
            return null;
        }

        // 生成 JWT Token
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(jwtOptions.SecretKey);
        
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Identity)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(jwtOptions.ExpireDays),
            Issuer = jwtOptions.Issuer,
            Audience = jwtOptions.Audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var jwtString = tokenHandler.WriteToken(token);

        return new LoginResultDto
        {
            Token = jwtString,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                EmailConfirmed = user.EmailConfirmed,
                Identity = user.Identity
            }
        };
    }
}
