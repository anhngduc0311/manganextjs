using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using TruyenKomi.Application.Common;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Domain.Entities;
using TruyenKomi.Infrastructure.Persistence;
using TruyenKomi.Infrastructure.Services;

namespace TruyenKomi.Infrastructure.BackgroundServices;

public class ViewSyncBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly RedisCacheService _redis;
    private readonly ILogger<ViewSyncBackgroundService> _logger;

    public ViewSyncBackgroundService(
        IServiceProvider serviceProvider,
        RedisCacheService redis,
        ILogger<ViewSyncBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _redis = redis;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ViewSyncBackgroundService started. Syncing views every 30 seconds.");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                await SyncViewsAsync();
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ViewSyncBackgroundService.");
            }
        }
    }

    private async Task SyncViewsAsync()
    {
        var db = _redis.GetDatabase();
        var conn = _redis.GetConnection();
        if (db == null || conn == null) return;

        var comicViewCounts = new Dictionary<string, long>();
        var chapterViewCounts = new Dictionary<string, long>();

        try
        {
            var endpoints = conn.GetEndPoints();
            foreach (var endpoint in endpoints)
            {
                var server = conn.GetServer(endpoint);
                foreach (var key in server.Keys(pattern: "comic:views:*"))
                {
                    var val = await db.StringGetDeleteAsync(key);
                    if (val.HasValue && long.TryParse(val.ToString(), out var count) && count > 0)
                    {
                        var comicId = key.ToString().Replace("comic:views:", "");
                        comicViewCounts[comicId] = comicViewCounts.GetValueOrDefault(comicId) + count;
                    }
                }

                foreach (var key in server.Keys(pattern: "chapter:views:*"))
                {
                    var val = await db.StringGetDeleteAsync(key);
                    if (val.HasValue && long.TryParse(val.ToString(), out var count) && count > 0)
                    {
                        var chapterId = key.ToString().Replace("chapter:views:", "");
                        chapterViewCounts[chapterId] = chapterViewCounts.GetValueOrDefault(chapterId) + count;
                    }
                }
            }

            if (comicViewCounts.Count == 0 && chapterViewCounts.Count == 0) return;

            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            foreach (var (comicId, count) in comicViewCounts)
            {
                await dbContext.Comics
                    .Where(c => c.Id == comicId)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(c => c.Views, c => c.Views + count)
                        .SetProperty(c => c.WeeklyViews, c => c.WeeklyViews + count)
                        .SetProperty(c => c.MonthlyViews, c => c.MonthlyViews + count));
            }

            foreach (var (chapterId, count) in chapterViewCounts)
            {
                await dbContext.Chapters
                    .Where(ch => ch.Id == chapterId)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(ch => ch.Views, ch => ch.Views + count));
            }

            _logger.LogInformation("Synced {ComicCount} comics and {ChapterCount} chapters views to PostgreSQL.",
                comicViewCounts.Count, chapterViewCounts.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to flush Redis views to PostgreSQL.");
        }
    }
}

public class CrawlerQueue : TruyenKomi.Application.Interfaces.ICrawlerQueue
{
    private readonly Channel<IngestPayloadDto> _channel = Channel.CreateUnbounded<IngestPayloadDto>();

    public ValueTask EnqueueAsync(IngestPayloadDto payload) => _channel.Writer.WriteAsync(payload);

    public IAsyncEnumerable<IngestPayloadDto> ReadAllAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAllAsync(cancellationToken);
}

public class CrawlerIngestBackgroundService : BackgroundService
{
    private readonly ICrawlerQueue _queue;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CrawlerIngestBackgroundService> _logger;

    public CrawlerIngestBackgroundService(
        ICrawlerQueue queue,
        IServiceProvider serviceProvider,
        ILogger<CrawlerIngestBackgroundService> logger)
    {
        _queue = queue;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("CrawlerIngestBackgroundService is running.");
        await foreach (var payload in _queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                // Upsert Comic
                var slug = !string.IsNullOrWhiteSpace(payload.Comic.Slug)
                    ? payload.Comic.Slug
                    : TextNormalizer.ToSlug(payload.Comic.Title);

                var comic = await db.Comics.FirstOrDefaultAsync(c => c.Slug == slug, stoppingToken);
                if (comic == null)
                {
                    comic = new Comic
                    {
                        Title = payload.Comic.Title,
                        TitleUnaccent = TextNormalizer.ToUnaccent(payload.Comic.Title),
                        Slug = slug,
                        OtherNames = payload.Comic.OtherNames,
                        Author = payload.Comic.Author,
                        Status = payload.Comic.Status,
                        CoverImage = payload.Comic.CoverImage ?? "/icons/icon-192.png",
                        BannerImage = payload.Comic.BannerImage,
                        Description = payload.Comic.Description,
                        UpdatedAt = DateTime.UtcNow
                    };
                    db.Comics.Add(comic);
                    await db.SaveChangesAsync(stoppingToken);
                }

                // Process Categories
                if (payload.Comic.Categories != null && payload.Comic.Categories.Count > 0)
                {
                    foreach (var catName in payload.Comic.Categories)
                    {
                        var catSlug = TextNormalizer.ToSlug(catName);
                        var category = await db.Categories.FirstOrDefaultAsync(c => c.Slug == catSlug, stoppingToken);
                        if (category == null)
                        {
                            category = new Category { Name = catName, Slug = catSlug };
                            db.Categories.Add(category);
                            await db.SaveChangesAsync(stoppingToken);
                        }

                        var exists = await db.ComicCategories.AnyAsync(cc => cc.ComicId == comic.Id && cc.CategoryId == category.Id, stoppingToken);
                        if (!exists)
                        {
                            db.ComicCategories.Add(new ComicCategory { ComicId = comic.Id, CategoryId = category.Id });
                        }
                    }
                    await db.SaveChangesAsync(stoppingToken);
                }

                // Process Chapters
                foreach (var chDto in payload.Chapters)
                {
                    var chapter = await db.Chapters.FirstOrDefaultAsync(ch => ch.ComicId == comic.Id && Math.Abs(ch.ChapterNumber - chDto.ChapterNumber) < 0.001, stoppingToken);
                    if (chapter == null)
                    {
                        chapter = new Chapter
                        {
                            ComicId = comic.Id,
                            ChapterNumber = chDto.ChapterNumber,
                            Title = chDto.Title,
                            CreatedAt = DateTime.UtcNow
                        };
                        db.Chapters.Add(chapter);
                        await db.SaveChangesAsync(stoppingToken);
                    }

                    // Add Pages
                    if (chDto.Pages != null && chDto.Pages.Count > 0)
                    {
                        var existingPages = await db.ChapterPages.Where(p => p.ChapterId == chapter.Id).ToListAsync(stoppingToken);
                        db.ChapterPages.RemoveRange(existingPages);

                        for (int i = 0; i < chDto.Pages.Count; i++)
                        {
                            db.ChapterPages.Add(new ChapterPage
                            {
                                ChapterId = chapter.Id,
                                PageIndex = i + 1,
                                ImageUrl = chDto.Pages[i]
                            });
                        }
                        await db.SaveChangesAsync(stoppingToken);
                    }
                }

                // Update Comic Latest Stats
                var allChapters = await db.Chapters.Where(c => c.ComicId == comic.Id).ToListAsync(stoppingToken);
                comic.ChapterCount = allChapters.Count;
                comic.LatestChapterNumber = allChapters.Count > 0 ? allChapters.Max(c => c.ChapterNumber) : null;
                comic.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(stoppingToken);

                _logger.LogInformation("Successfully ingested comic '{Title}' with {ChapterCount} chapters.", comic.Title, payload.Chapters.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to ingest comic payload for '{Title}'.", payload.Comic?.Title);
            }
        }
    }
}
