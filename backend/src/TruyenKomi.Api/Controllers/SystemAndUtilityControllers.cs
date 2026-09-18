using System;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.IO;
using System.Security.Claims;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Infrastructure.Persistence;
using TruyenKomi.Infrastructure.Services;

namespace TruyenKomi.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> ListRecent([FromQuery] int limit = 10)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var list = await _notificationService.ListRecentAsync(userId, limit);
        return Ok(list);
    }

    [Authorize]
    [HttpGet("unread-count")]
    public async Task<IActionResult> CountUnread()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var count = await _notificationService.CountUnreadAsync(userId);
        return Ok(new { count });
    }

    [Authorize]
    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkRead(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var success = await _notificationService.MarkReadAsync(userId, id);
        return Ok(new { success });
    }

    [Authorize]
    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var success = await _notificationService.MarkAllReadAsync(userId);
        return Ok(new { success });
    }
}

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var report = await _reportService.CreateReportAsync(userId, dto);
        return Ok(report);
    }

    [Authorize(Roles = "ADMIN,MODERATOR")]
    [HttpGet("admin/list")]
    public async Task<IActionResult> ListReports(
        [FromQuery] int page = 1,
        [FromQuery] int perPage = 30,
        [FromQuery] string? status = null)
    {
        var list = await _reportService.ListReportsAsync(page, perPage, status);
        return Ok(list);
    }

    [Authorize(Roles = "ADMIN,MODERATOR")]
    [HttpPatch("admin/{id}/resolve")]
    public async Task<IActionResult> ResolveReport(string id, [FromBody] ResolveReportDto dto)
    {
        var resolved = await _reportService.ResolveReportAsync(id, dto);
        return Ok(resolved);
    }
}

[ApiController]
[Route("api/upload")]
public class StorageController : ControllerBase
{
    private readonly IStorageService _storageService;

    public StorageController(IStorageService storageService)
    {
        _storageService = storageService;
    }

    [Authorize(Roles = "ADMIN,MODERATOR")]
    [HttpPost("presign")]
    public async Task<IActionResult> GetPresignedUrl([FromBody] GetUploadUrlDto dto)
    {
        var result = await _storageService.GetPresignedPutUrlAsync(dto.Filename, dto.ContentType);
        return Ok(result);
    }
}

[ApiController]
[Route("api/crawler")]
public class CrawlerController : ControllerBase
{
    private readonly ICrawlerService _crawlerService;
    private readonly IConfiguration _config;

    public CrawlerController(ICrawlerService crawlerService, IConfiguration config)
    {
        _crawlerService = crawlerService;
        _config = config;
    }

    [HttpPost("ingest")]
    public async Task<IActionResult> Ingest(
        [FromHeader(Name = "Authorization")] string? authHeader,
        [FromBody] IngestPayloadDto payload)
    {
        var secret = _config["CRAWLER_SECRET_KEY"] ?? "dev-crawler-secret";
        if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
        {
            return Unauthorized(new { message = "Thiếu Bearer Token ủy quyền" });
        }

        var token = authHeader.Substring("Bearer ".Length).Trim();
        if (token != secret)
        {
            return Unauthorized(new { message = "Secret key không hợp lệ" });
        }

        var result = await _crawlerService.IngestAsync(payload);
        return Ok(result);
    }
}

[ApiController]
[Route("api/views")]
public class ViewsController : ControllerBase
{
    private readonly IViewsService _viewsService;

    public ViewsController(IViewsService viewsService)
    {
        _viewsService = viewsService;
    }

    [HttpPost]
    public async Task<IActionResult> RecordView([FromBody] RecordViewDto dto)
    {
        await _viewsService.RecordViewAsync(dto);
        return Ok(new { success = true });
    }
}

[ApiController]
[Route("api/realtime")]
public class RealtimeController : ControllerBase
{
    private readonly RedisCacheService _redis;
    private static readonly ConcurrentDictionary<string, int> _mockCounts = new();

    public RealtimeController(RedisCacheService redis)
    {
        _redis = redis;
    }

    [HttpGet("sse")]
    public async Task GetSse([FromQuery] string chapterId, CancellationToken cancellationToken)
    {
        Response.Headers.Append("Content-Type", "text/event-stream");
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");

        var clientId = Guid.NewGuid().ToString();
        var key = $"chapter:online:{chapterId ?? "global"}";

        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                int count = 1;
                var db = _redis.GetDatabase();
                if (db != null)
                {
                    await db.SetAddAsync(key, clientId);
                    await db.KeyExpireAsync(key, TimeSpan.FromSeconds(30));
                    var card = await db.SetLengthAsync(key);
                    count = Math.Max(1, (int)card);
                }
                else
                {
                    count = _mockCounts.AddOrUpdate(chapterId ?? "global", 1, (_, c) => c);
                }

                var data = JsonSerializer.Serialize(new { liveCount = count });
                await Response.WriteAsync($"data: {data}\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);

                await Task.Delay(4000, cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            // Client disconnected
        }
        finally
        {
            var db = _redis.GetDatabase();
            if (db != null)
            {
                await db.SetRemoveAsync(key, clientId);
            }
        }
    }
}

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly RedisCacheService _redis;

    public HealthController(AppDbContext db, RedisCacheService redis)
    {
        _db = db;
        _redis = redis;
    }

    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        var timestamp = DateTime.UtcNow.ToString("o");
        var checks = new
        {
            db = new { ok = false, latencyMs = -1L, error = (string?)null },
            redis = new { ok = false, latencyMs = -1L, info = (string?)null, error = (string?)null }
        };

        // 1. DB
        var dbOk = false;
        long dbLatency = -1;
        string? dbError = null;
        try
        {
            var sw = Stopwatch.StartNew();
            await _db.Database.ExecuteSqlRawAsync("SELECT 1");
            sw.Stop();
            dbOk = true;
            dbLatency = sw.ElapsedMilliseconds;
        }
        catch (Exception ex)
        {
            dbError = ex.Message;
        }

        // 2. Redis
        var redisOk = false;
        long redisLatency = -1;
        string? redisInfo = null;
        string? redisError = null;
        try
        {
            var db = _redis.GetDatabase();
            if (db != null)
            {
                var sw = Stopwatch.StartNew();
                await db.PingAsync();
                sw.Stop();
                redisOk = true;
                redisLatency = sw.ElapsedMilliseconds;
            }
            else
            {
                redisOk = true;
                redisLatency = 0;
                redisInfo = "Using in-memory fallback";
            }
        }
        catch (Exception ex)
        {
            redisError = ex.Message;
        }

        var allOk = dbOk && redisOk;
        return StatusCode(allOk ? 200 : 503, new
        {
            status = allOk ? "ok" : "degraded",
            timestamp,
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development",
            version = "1.0.0",
            checks = new
            {
                db = new { ok = dbOk, latencyMs = dbLatency, error = dbError },
                redis = new { ok = redisOk, latencyMs = redisLatency, info = redisInfo, error = redisError }
            }
        });
    }
}
