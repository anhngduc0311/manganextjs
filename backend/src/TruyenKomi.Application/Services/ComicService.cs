using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TruyenKomi.Application.Common;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Domain.Entities;
using TruyenKomi.Domain.Enums;

namespace TruyenKomi.Application.Services;

public class ComicService : IComicService
{
    private readonly IAppDbContext _db;
    private readonly ICacheService _cache;

    public ComicService(IAppDbContext db, ICacheService cache)
    {
        _db = db;
        _cache = cache;
    }

    public async Task<HomeFeedDto> GetHomeFeedAsync()
    {
        var cached = await _cache.GetAsync<HomeFeedDto>("feed:home");
        if (cached != null) return cached;

        var hotComics = await _db.Comics
            .AsNoTracking()
            .OrderByDescending(c => c.Views)
            .Take(10)
            .Include(c => c.Categories).ThenInclude(cc => cc.Category)
            .Select(c => MapToCardDto(c))
            .ToListAsync();

        var latestComics = await _db.Comics
            .AsNoTracking()
            .OrderByDescending(c => c.UpdatedAt)
            .Take(24)
            .Include(c => c.Categories).ThenInclude(cc => cc.Category)
            .Select(c => MapToCardDto(c))
            .ToListAsync();

        var result = new HomeFeedDto
        {
            Hot = hotComics,
            Latest = latestComics
        };

        await _cache.SetAsync("feed:home", result, TimeSpan.FromSeconds(60));
        return result;
    }

    public async Task<List<ComicCardDto>> GetRankingsAsync(string period)
    {
        var cacheKey = $"ranking:{period}";
        var cached = await _cache.GetAsync<List<ComicCardDto>>(cacheKey);
        if (cached != null) return cached;

        var query = _db.Comics.AsNoTracking().AsQueryable();

        query = period switch
        {
            "weekly" => query.OrderByDescending(c => c.WeeklyViews),
            "monthly" => query.OrderByDescending(c => c.MonthlyViews),
            _ => query.OrderByDescending(c => c.Views)
        };

        var comics = await query
            .Take(10)
            .Include(c => c.Categories).ThenInclude(cc => cc.Category)
            .Select(c => MapToCardDto(c))
            .ToListAsync();

        await _cache.SetAsync(cacheKey, comics, TimeSpan.FromMinutes(15));
        return comics;
    }

    public async Task<List<GenreDto>> ListCategoriesAsync()
    {
        var cached = await _cache.GetAsync<List<GenreDto>>("categories:all");
        if (cached != null) return cached;

        var categories = await _db.Categories
            .AsNoTracking()
            .Select(cat => new GenreDto
            {
                Id = cat.Id,
                Name = cat.Name,
                Slug = cat.Slug,
                Description = cat.Description,
                ComicCount = cat.Comics.Count
            })
            .OrderBy(c => c.Name)
            .ToListAsync();

        await _cache.SetAsync("categories:all", categories, TimeSpan.FromHours(1));
        return categories;
    }

    public async Task<PagedResult<ComicCardDto>> ListComicsAsync(
        List<string>? genres,
        ComicStatus? status,
        string? sort,
        int page,
        int perPage)
    {
        var query = _db.Comics.AsNoTracking().AsQueryable();

        if (genres != null && genres.Count > 0)
        {
            foreach (var g in genres)
            {
                var genreSlug = TextNormalizer.ToSlug(g);
                query = query.Where(c => c.Categories.Any(cc => cc.Category.Slug == genreSlug || cc.Category.Name.ToLower() == g.ToLower()));
            }
        }

        if (status.HasValue)
        {
            query = query.Where(c => c.Status == status.Value);
        }

        query = sort switch
        {
            "views" => query.OrderByDescending(c => c.Views),
            "rating" => query.OrderByDescending(c => c.RatingAvg).ThenByDescending(c => c.RatingCount),
            "new" => query.OrderByDescending(c => c.CreatedAt),
            _ => query.OrderByDescending(c => c.UpdatedAt)
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * perPage)
            .Take(perPage)
            .Include(c => c.Categories).ThenInclude(cc => cc.Category)
            .Select(c => MapToCardDto(c))
            .ToListAsync();

        return new PagedResult<ComicCardDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PerPage = perPage
        };
    }

    public async Task<ComicDetailDto?> GetBySlugAsync(string slug)
    {
        var comic = await _db.Comics
            .AsNoTracking()
            .Include(c => c.Categories).ThenInclude(cc => cc.Category)
            .Include(c => c.Chapters)
            .FirstOrDefaultAsync(c => c.Slug == slug);

        if (comic == null) return null;

        return new ComicDetailDto
        {
            Id = comic.Id,
            Title = comic.Title,
            Slug = comic.Slug,
            OtherNames = comic.OtherNames,
            Author = comic.Author,
            Status = comic.Status,
            CoverImage = comic.CoverImage,
            BannerImage = comic.BannerImage,
            Description = comic.Description,
            Views = comic.Views,
            RatingAvg = comic.RatingAvg,
            RatingCount = comic.RatingCount,
            ChapterCount = comic.Chapters.Count,
            LatestChapterNumber = comic.LatestChapterNumber,
            CreatedAt = comic.CreatedAt,
            UpdatedAt = comic.UpdatedAt,
            Categories = comic.Categories.Select(cc => new GenreDto
            {
                Id = cc.Category.Id,
                Name = cc.Category.Name,
                Slug = cc.Category.Slug,
                Description = cc.Category.Description
            }).ToList(),
            Chapters = comic.Chapters
                .OrderByDescending(ch => ch.ChapterNumber)
                .Select(ch => new ChapterBriefDto
                {
                    Id = ch.Id,
                    ChapterNumber = ch.ChapterNumber,
                    Title = ch.Title,
                    Views = ch.Views,
                    CreatedAt = ch.CreatedAt
                }).ToList()
        };
    }

    public async Task<ComicDetailDto> CreateComicAsync(CreateComicDto dto)
    {
        var slug = !string.IsNullOrWhiteSpace(dto.Slug)
            ? dto.Slug
            : TextNormalizer.ToSlug(dto.Title);

        var existing = await _db.Comics.AnyAsync(c => c.Slug == slug);
        if (existing)
        {
            slug = $"{slug}-{Guid.NewGuid().ToString()[..6]}";
        }

        var comic = new Comic
        {
            Title = dto.Title.Trim(),
            TitleUnaccent = TextNormalizer.ToUnaccent(dto.Title),
            Slug = slug,
            OtherNames = dto.OtherNames,
            Author = dto.Author,
            Status = dto.Status,
            CoverImage = dto.CoverImage,
            BannerImage = dto.BannerImage,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Comics.Add(comic);
        await _db.SaveChangesAsync();

        if (dto.CategoryIds != null && dto.CategoryIds.Count > 0)
        {
            foreach (var catId in dto.CategoryIds)
            {
                _db.ComicCategories.Add(new ComicCategory
                {
                    ComicId = comic.Id,
                    CategoryId = catId
                });
            }
            await _db.SaveChangesAsync();
        }

        await _cache.RemoveAsync("feed:home");
        return (await GetBySlugAsync(comic.Slug))!;
    }

    public async Task<ComicDetailDto> UpdateComicAsync(string id, UpdateComicDto dto)
    {
        var comic = await _db.Comics
            .Include(c => c.Categories)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (comic == null) throw new KeyNotFoundException("Không tìm thấy truyện.");

        if (!string.IsNullOrWhiteSpace(dto.Title))
        {
            comic.Title = dto.Title.Trim();
            comic.TitleUnaccent = TextNormalizer.ToUnaccent(dto.Title);
        }

        if (!string.IsNullOrWhiteSpace(dto.Slug))
        {
            comic.Slug = dto.Slug.Trim();
        }

        if (dto.OtherNames != null) comic.OtherNames = dto.OtherNames;
        if (dto.Author != null) comic.Author = dto.Author;
        if (dto.Status.HasValue) comic.Status = dto.Status.Value;
        if (!string.IsNullOrWhiteSpace(dto.CoverImage)) comic.CoverImage = dto.CoverImage;
        if (dto.BannerImage != null) comic.BannerImage = dto.BannerImage;
        if (dto.Description != null) comic.Description = dto.Description;

        comic.UpdatedAt = DateTime.UtcNow;

        if (dto.CategoryIds != null)
        {
            _db.ComicCategories.RemoveRange(comic.Categories);
            foreach (var catId in dto.CategoryIds)
            {
                _db.ComicCategories.Add(new ComicCategory
                {
                    ComicId = comic.Id,
                    CategoryId = catId
                });
            }
        }

        await _db.SaveChangesAsync();
        await _cache.RemoveAsync("feed:home");
        return (await GetBySlugAsync(comic.Slug))!;
    }

    public async Task<bool> DeleteComicAsync(string id)
    {
        var comic = await _db.Comics.FirstOrDefaultAsync(c => c.Id == id);
        if (comic == null) return false;

        _db.Comics.Remove(comic);
        await _db.SaveChangesAsync();
        await _cache.RemoveAsync("feed:home");
        return true;
    }

    public async Task<GenreDto> CreateCategoryAsync(CreateGenreDto dto)
    {
        var slug = !string.IsNullOrWhiteSpace(dto.Slug)
            ? dto.Slug
            : TextNormalizer.ToSlug(dto.Name);

        var existing = await _db.Categories.AnyAsync(c => c.Slug == slug || c.Name.ToLower() == dto.Name.ToLower());
        if (existing) throw new InvalidOperationException("Thể loại đã tồn tại.");

        var category = new Category
        {
            Name = dto.Name.Trim(),
            Slug = slug,
            Description = dto.Description
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        await _cache.RemoveAsync("categories:all");

        return new GenreDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description
        };
    }

    public async Task<GenreDto> UpdateCategoryAsync(string id, UpdateGenreDto dto)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (category == null) throw new KeyNotFoundException("Không tìm thấy thể loại.");

        if (!string.IsNullOrWhiteSpace(dto.Name)) category.Name = dto.Name.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Slug)) category.Slug = dto.Slug.Trim();
        if (dto.Description != null) category.Description = dto.Description;

        await _db.SaveChangesAsync();
        await _cache.RemoveAsync("categories:all");

        return new GenreDto
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            Description = category.Description
        };
    }

    public async Task<bool> DeleteCategoryAsync(string id)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (category == null) return false;

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        await _cache.RemoveAsync("categories:all");
        return true;
    }

    public static ComicCardDto MapToCardDto(Comic c) => new()
    {
        Id = c.Id,
        Title = c.Title,
        Slug = c.Slug,
        CoverImage = c.CoverImage,
        Status = c.Status,
        Views = c.Views,
        RatingAvg = c.RatingAvg,
        RatingCount = c.RatingCount,
        ChapterCount = c.Chapters != null ? c.Chapters.Count : c.ChapterCount,
        LatestChapterNumber = c.LatestChapterNumber,
        UpdatedAt = c.UpdatedAt,
        Categories = c.Categories != null ? c.Categories.Select(cc => cc.Category.Name).ToList() : new()
    };
}
