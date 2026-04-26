using System.IO.Compression;
using System.Text;
using Downloader.Data;
using Downloader.Data.Models;
using Downloader.DataApi.Repos;
using Downloader.DataApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.IdentityModel.Tokens;
using NpgsqlDataProtection;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

DotNetEnv.Env.Load();

#region 数据库

var connectionString = Environment.GetEnvironmentVariable("SQL", EnvironmentVariableTarget.Process) ??
                       builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContextFactory<DownloaderContext>(options =>
    {
        options.UseSqlite("Data Source=downloader.db");
        options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
    });

    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo("./keys"));
}
else
{
    builder.Services.AddDbContextFactory<DownloaderContext>(options =>
    {
        options.UseNpgsql(connectionString);
        options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));

        builder.Services.AddDataProtection()
            .PersistKeysToPostgres(connectionString, true);
    });
}

#endregion

#region 跨域

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(origin =>
                origin.EndsWith(".zeabur.app") || // 支持所有 zeabur.app 子域名
                origin.EndsWith(".xauat.site") || // 支持所有 xauat.site 子域名
                origin.StartsWith("http://localhost")) // 支持本地开发环境
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials() // 如果需要发送凭据（如cookies、认证头等）
            .WithExposedHeaders("X-Refresh-Token"); // 允许前端访问X-Refresh-Token响应头
    });
});

#endregion

#region 仓库/服务 依赖注入

builder.Services.AddScoped<IAppRepo, AppRepo>();
builder.Services.AddScoped<IChannelRepo, ChannelRepo>();
builder.Services.AddScoped<IProtocolRepo, ProtocolRepo>();
builder.Services.AddScoped<IReleaseRepo, ReleaseRepo>();
builder.Services.AddScoped<ISoftRepo, SoftRepo>();
builder.Services.AddScoped<IUserRepo, UserRepo>();

builder.Services.AddScoped<IAppService, AppService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IChannelService, ChannelService>();
builder.Services.AddScoped<IProtocolService, ProtocolService>();
builder.Services.AddScoped<IReleaseService, ReleaseService>();
builder.Services.AddScoped<ISoftService, SoftService>();
builder.Services.AddScoped<IUserService, UserService>();

#endregion

#region 身份认证

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "default_secret_key_needs_to_be_at_least_32_characters_long";

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

#endregion

#region 控制器基本设置

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.Configure<FormOptions>(options => { options.MultipartBodyLengthLimit = 2_147_483_648; });

builder.WebHost.ConfigureKestrel(options => { options.Limits.MaxRequestBodySize = 2_147_483_648; });

#endregion

#region 压缩

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest; // 或 CompressionLevel.Optimal
});

builder.Services.Configure<GzipCompressionProviderOptions>(options => { options.Level = CompressionLevel.Fastest; });

#endregion

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// 优化数据库迁移策略，异步执行迁移
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<DownloaderContext>();

    try
    {
        var pending = context.Database.GetPendingMigrations();
        var enumerable = pending as string[] ?? pending.ToArray();

        if (enumerable.Length != 0)
        {
            Console.WriteLine("Pending migrations: " + string.Join("; ", enumerable));
            await context.Database.MigrateAsync();
            Console.WriteLine("Migrations applied successfully.");
        }
        else
        {
            Console.WriteLine("No pending migrations.");
        }

        // 初始化数据
        if (!await context.Users.AnyAsync())
        {
            var user = Environment.GetEnvironmentVariable("USER", EnvironmentVariableTarget.Process);
            Console.WriteLine(user);
            var model = new UserModel()
            {
                Username = "root",
                Password = "123456".StringToHash(),
                Identity = "Admin",
                Email = "adminTest@marketours.com"
            };
            context.Users.Add(model);
        }

        await context.SaveChangesAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine("Migration error: " + ex);
        // 不要抛出异常，避免应用启动失败
    }
    finally
    {
        await context.DisposeAsync();
    }
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();