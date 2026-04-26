using System.Text;
using Downloader.Data;
using Downloader.Data.Models;
using Downloader.DataApi.Repos;
using Downloader.DataApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// 1. DbContextFactory
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

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
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection") ??
                          "Host=localhost;Database=downloader;Username=postgres;Password=postgres");
        options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
    });
}

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

// 2. Repos & Services
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

// 3. JWT Authentication
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

builder.Services.AddControllers();
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 2_147_483_648;
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 2_147_483_648;
});
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
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
app.MapScalarApiReference();

app.Run();
