using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Domain.Entities;

namespace TruyenKomi.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IAppDbContext _db;

    public NotificationService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<List<NotificationDto>> ListRecentAsync(string userId, int limit)
    {
        return await _db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                LinkUrl = n.LinkUrl,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<int> CountUnreadAsync(string userId)
    {
        return await _db.Notifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task<bool> MarkReadAsync(string userId, string notificationId)
    {
        var notif = await _db.Notifications.FirstOrDefaultAsync(n => n.UserId == userId && n.Id == notificationId);
        if (notif == null) return false;

        notif.IsRead = true;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MarkAllReadAsync(string userId)
    {
        await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        return true;
    }

    public async Task CreateNotificationAsync(string userId, string title, string message, string? linkUrl)
    {
        _db.Notifications.Add(new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            LinkUrl = linkUrl,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }
}

public class ReportService : IReportService
{
    private readonly IAppDbContext _db;

    public ReportService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ReportDto> CreateReportAsync(string? userId, CreateReportDto dto)
    {
        var chapter = await _db.Chapters
            .Include(ch => ch.Comic)
            .FirstOrDefaultAsync(ch => ch.Id == dto.ChapterId);

        if (chapter == null) throw new KeyNotFoundException("Không tìm thấy chương truyện.");

        var report = new Report
        {
            UserId = userId,
            ChapterId = dto.ChapterId,
            Reason = dto.Reason.Trim(),
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow
        };

        _db.Reports.Add(report);
        await _db.SaveChangesAsync();

        return new ReportDto
        {
            Id = report.Id,
            UserId = userId,
            ChapterId = chapter.Id,
            ChapterNumber = chapter.ChapterNumber,
            ComicId = chapter.ComicId,
            ComicTitle = chapter.Comic.Title,
            ComicSlug = chapter.Comic.Slug,
            Reason = report.Reason,
            Status = report.Status,
            CreatedAt = report.CreatedAt
        };
    }

    public async Task<PagedResult<ReportDto>> ListReportsAsync(int page, int perPage, string? status)
    {
        var query = _db.Reports.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(r => r.Status == status);
        }

        query = query.OrderByDescending(r => r.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * perPage)
            .Take(perPage)
            .Include(r => r.User)
            .Include(r => r.Chapter).ThenInclude(ch => ch.Comic)
            .Select(r => new ReportDto
            {
                Id = r.Id,
                UserId = r.UserId,
                Username = r.User != null ? r.User.Username : null,
                ChapterId = r.ChapterId,
                ChapterNumber = r.Chapter.ChapterNumber,
                ComicId = r.Chapter.ComicId,
                ComicTitle = r.Chapter.Comic.Title,
                ComicSlug = r.Chapter.Comic.Slug,
                Reason = r.Reason,
                Status = r.Status,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<ReportDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PerPage = perPage
        };
    }

    public async Task<ReportDto> ResolveReportAsync(string id, ResolveReportDto dto)
    {
        var report = await _db.Reports
            .Include(r => r.User)
            .Include(r => r.Chapter).ThenInclude(ch => ch.Comic)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report == null) throw new KeyNotFoundException("Không tìm thấy báo lỗi.");

        report.Status = dto.Status;
        await _db.SaveChangesAsync();

        return new ReportDto
        {
            Id = report.Id,
            UserId = report.UserId,
            Username = report.User?.Username,
            ChapterId = report.ChapterId,
            ChapterNumber = report.Chapter.ChapterNumber,
            ComicId = report.Chapter.ComicId,
            ComicTitle = report.Chapter.Comic.Title,
            ComicSlug = report.Chapter.Comic.Slug,
            Reason = report.Reason,
            Status = report.Status,
            CreatedAt = report.CreatedAt
        };
    }
}

public class CrawlerService : ICrawlerService
{
    private readonly ICrawlerQueue _queue;

    public CrawlerService(ICrawlerQueue queue)
    {
        _queue = queue;
    }

    public async Task<object> IngestAsync(IngestPayloadDto payload)
    {
        await _queue.EnqueueAsync(payload);
        return new { success = true, queued = true, comic = payload.Comic.Title, chapters = payload.Chapters.Count };
    }
}

public class ViewsService : IViewsService
{
    private readonly ICacheService _cache;

    public ViewsService(ICacheService cache)
    {
        _cache = cache;
    }

    public async Task RecordViewAsync(RecordViewDto dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.ComicId))
        {
            await _cache.IncrementAsync($"comic:views:{dto.ComicId}", 1);
        }

        if (!string.IsNullOrWhiteSpace(dto.ChapterId))
        {
            await _cache.IncrementAsync($"chapter:views:{dto.ChapterId}", 1);
        }
    }
}
