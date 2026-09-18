using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Domain.Entities;

namespace TruyenKomi.Application.Services;

public class ChapterService : IChapterService
{
    private readonly IAppDbContext _db;
    private readonly ICacheService _cache;

    public ChapterService(IAppDbContext db, ICacheService cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<ReaderDataDto?> GetReaderDataAsync(string comicSlug, double chapterNumber)
    {
        var comic = await _db.Comics
            .AsNoTracking()
            .Include(c => c.Categories).ThenInclude(cc => cc.Category)
            .FirstOrDefaultAsync(c => c.Slug == comicSlug);

        if (comic == null) return null;

        var allChapters = await _db.Chapters
            .AsNoTracking()
            .Where(ch => ch.ComicId == comic.Id)
            .OrderBy(ch => ch.ChapterNumber)
            .Select(ch => new { ch.Id, ch.ChapterNumber, ch.Title, ch.Views, ch.CreatedAt })
            .ToListAsync();

        var currentChapterInfo = allChapters.FirstOrDefault(ch => Math.Abs(ch.ChapterNumber - chapterNumber) < 0.001);
        if (currentChapterInfo == null) return null;

        // Redis Cache for pages
        var cacheKey = $"chapter:{currentChapterInfo.Id}:pages";
        var pages = await _cache.GetAsync<List<ChapterPageDto>>(cacheKey);

        if (pages == null || pages.Count == 0)
        {
            pages = await _db.ChapterPages
                .AsNoTracking()
                .Where(p => p.ChapterId == currentChapterInfo.Id)
                .OrderBy(p => p.PageIndex)
                .Select(p => new ChapterPageDto
                {
                    Id = p.Id,
                    PageIndex = p.PageIndex,
                    ImageUrl = p.ImageUrl
                })
                .ToListAsync();

            if (pages.Count > 0)
            {
                await _cache.SetAsync(cacheKey, pages, TimeSpan.FromHours(2));
            }
        }

        // View Buffering (Redis atomic INCR)
        await _cache.IncrementAsync($"comic:views:{comic.Id}", 1);
        await _cache.IncrementAsync($"chapter:views:{currentChapterInfo.Id}", 1);

        // Find prev / next chapter
        var currentIndex = allChapters.FindIndex(ch => ch.Id == currentChapterInfo.Id);
        double? prevChapterNumber = currentIndex > 0 ? allChapters[currentIndex - 1].ChapterNumber : null;
        double? nextChapterNumber = currentIndex < allChapters.Count - 1 ? allChapters[currentIndex + 1].ChapterNumber : null;

        return new ReaderDataDto
        {
            Comic = ComicService.MapToCardDto(comic),
            Chapter = new ChapterDetailDto
            {
                Id = currentChapterInfo.Id,
                ComicId = comic.Id,
                ChapterNumber = currentChapterInfo.ChapterNumber,
                Title = currentChapterInfo.Title,
                Views = currentChapterInfo.Views,
                CreatedAt = currentChapterInfo.CreatedAt,
                Pages = pages
            },
            Pages = pages,
            PrevChapterNumber = prevChapterNumber,
            NextChapterNumber = nextChapterNumber
        };
    }

    public async Task<List<ChapterBriefDto>> ListChaptersByComicIdAsync(string comicId)
    {
        return await _db.Chapters
            .AsNoTracking()
            .Where(ch => ch.ComicId == comicId)
            .OrderByDescending(ch => ch.ChapterNumber)
            .Select(ch => new ChapterBriefDto
            {
                Id = ch.Id,
                ChapterNumber = ch.ChapterNumber,
                Title = ch.Title,
                Views = ch.Views,
                CreatedAt = ch.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<ChapterDetailDto>> ListChaptersAdminAsync(string comicId)
    {
        return await _db.Chapters
            .AsNoTracking()
            .Where(ch => ch.ComicId == comicId)
            .OrderByDescending(ch => ch.ChapterNumber)
            .Include(ch => ch.Pages)
            .Select(ch => new ChapterDetailDto
            {
                Id = ch.Id,
                ComicId = ch.ComicId,
                ChapterNumber = ch.ChapterNumber,
                Title = ch.Title,
                Views = ch.Views,
                CreatedAt = ch.CreatedAt,
                Pages = ch.Pages.OrderBy(p => p.PageIndex).Select(p => new ChapterPageDto
                {
                    Id = p.Id,
                    PageIndex = p.PageIndex,
                    ImageUrl = p.ImageUrl
                }).ToList()
            })
            .ToListAsync();
    }

    public async Task<ChapterDetailDto> UpsertChapterAsync(UpsertChapterDto dto)
    {
        var comic = await _db.Comics.FirstOrDefaultAsync(c => c.Id == dto.ComicId);
        if (comic == null) throw new KeyNotFoundException("Không tìm thấy bộ truyện.");

        Chapter? chapter = null;
        if (!string.IsNullOrWhiteSpace(dto.Id))
        {
            chapter = await _db.Chapters.Include(ch => ch.Pages).FirstOrDefaultAsync(ch => ch.Id == dto.Id);
        }

        if (chapter == null)
        {
            chapter = await _db.Chapters.Include(ch => ch.Pages)
                .FirstOrDefaultAsync(ch => ch.ComicId == dto.ComicId && Math.Abs(ch.ChapterNumber - dto.ChapterNumber) < 0.001);
        }

        if (chapter == null)
        {
            chapter = new Chapter
            {
                ComicId = dto.ComicId,
                ChapterNumber = dto.ChapterNumber,
                Title = dto.Title,
                CreatedAt = DateTime.UtcNow
            };
            _db.Chapters.Add(chapter);
            await _db.SaveChangesAsync();
        }
        else
        {
            chapter.ChapterNumber = dto.ChapterNumber;
            chapter.Title = dto.Title;
        }

        // Update pages
        if (dto.PageUrls != null)
        {
            _db.ChapterPages.RemoveRange(chapter.Pages);
            for (int i = 0; i < dto.PageUrls.Count; i++)
            {
                _db.ChapterPages.Add(new ChapterPage
                {
                    ChapterId = chapter.Id,
                    PageIndex = i + 1,
                    ImageUrl = dto.PageUrls[i]
                });
            }
        }

        // Update comic latest chapter
        var allChapters = await _db.Chapters.Where(c => c.ComicId == comic.Id).ToListAsync();
        comic.ChapterCount = allChapters.Count;
        comic.LatestChapterNumber = allChapters.Count > 0 ? allChapters.Max(c => c.ChapterNumber) : null;
        comic.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _cache.RemoveAsync($"chapter:{chapter.Id}:pages");
        await _cache.RemoveAsync("feed:home");

        return (await ListChaptersAdminAsync(comic.Id)).First(ch => ch.Id == chapter.Id);
    }

    public async Task<bool> DeleteChapterAsync(string id)
    {
        var chapter = await _db.Chapters.FirstOrDefaultAsync(ch => ch.Id == id);
        if (chapter == null) return false;

        var comicId = chapter.ComicId;
        _db.Chapters.Remove(chapter);
        await _db.SaveChangesAsync();

        var comic = await _db.Comics.FirstOrDefaultAsync(c => c.Id == comicId);
        if (comic != null)
        {
            var remainingChapters = await _db.Chapters.Where(c => c.ComicId == comicId).ToListAsync();
            comic.ChapterCount = remainingChapters.Count;
            comic.LatestChapterNumber = remainingChapters.Count > 0 ? remainingChapters.Max(c => c.ChapterNumber) : null;
            comic.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        await _cache.RemoveAsync($"chapter:{id}:pages");
        await _cache.RemoveAsync("feed:home");
        return true;
    }
}
