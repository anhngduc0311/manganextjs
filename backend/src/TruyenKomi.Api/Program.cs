using System;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Npgsql;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Application.Services;
using TruyenKomi.Infrastructure.BackgroundServices;
using TruyenKomi.Infrastructure.Persistence;
using TruyenKomi.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")))
{
    builder.WebHost.UseUrls("http://127.0.0.1:5000", "http://localhost:5000");
}

// 1. Add Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// 2. Database Configuration (PostgreSQL EF Core)
var databaseUrl = builder.Configuration["DATABASE_URL"] 
                  ?? builder.Configuration.GetConnectionString("DefaultConnection") 
                  ?? "Host=localhost;Port=5432;Database=truyenkomi;Username=postgres;Password=postgres";

string connectionString;
if (databaseUrl.StartsWith("postgres://") || databaseUrl.StartsWith("postgresql://"))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    var npgsqlBuilder = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Database = uri.AbsolutePath.TrimStart('/'),
        Username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "postgres",
        Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "",
        SslMode = SslMode.Prefer
    };
    connectionString = npgsqlBuilder.ToString();
}
else
{
    connectionString = databaseUrl;
}

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});
builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

// 3. Register Infrastructure & Application Services
builder.Services.AddSingleton<RedisCacheService>();
builder.Services.AddSingleton<ICacheService>(sp => sp.GetRequiredService<RedisCacheService>());
builder.Services.AddSingleton<IStorageService, StorageService>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<ICrawlerQueue, CrawlerQueue>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IComicService, ComicService>();
builder.Services.AddScoped<IChapterService, ChapterService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<IRatingService, RatingService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ISearchService, SearchService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<ICrawlerService, CrawlerService>();
builder.Services.AddScoped<IViewsService, ViewsService>();

// 4. Register Background Workers
builder.Services.AddHostedService<ViewSyncBackgroundService>();
builder.Services.AddHostedService<CrawlerIngestBackgroundService>();

// 5. Authentication & JWT Bearer Setup
var jwtSecret = builder.Configuration["Jwt:Secret"] 
                ?? builder.Configuration["AUTH_SECRET"] 
                ?? builder.Configuration["NEXTAUTH_SECRET"] 
                ?? "super_secret_truyenkomi_key_1234567890123456";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

// 6. CORS Setup
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 7. Swagger Setup
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TruyenKomi API (.NET 10)",
        Version = "v1",
        Description = "Nền tảng đọc & quản lý truyện tranh trực tuyến hiện đại TruyenKomi ASP.NET Core API."
    });
});

var app = builder.Build();

// Configure HTTP pipeline
app.UseCors("AllowAll");

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "TruyenKomi API v1");
    c.RoutePrefix = "swagger";
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
