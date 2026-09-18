using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using TruyenKomi.Domain.Enums;

namespace TruyenKomi.Application.DTOs;

public class ComicCardDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string CoverImage { get; set; } = string.Empty;
    public ComicStatus Status { get; set; }
    public long Views { get; set; }
    public double RatingAvg { get; set; }
    public int RatingCount { get; set; }
    public int ChapterCount { get; set; }
    public double? LatestChapterNumber { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<string> Categories { get; set; } = new();
}

public class ChapterBriefDto
{
    public string Id { get; set; } = string.Empty;
    public double ChapterNumber { get; set; }
    public string? Title { get; set; }
    public long Views { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ComicDetailDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? OtherNames { get; set; }
    public string? Author { get; set; }
    public ComicStatus Status { get; set; }
    public string CoverImage { get; set; } = string.Empty;
    public string? BannerImage { get; set; }
    public string? Description { get; set; }
    public long Views { get; set; }
    public double RatingAvg { get; set; }
    public int RatingCount { get; set; }
    public int ChapterCount { get; set; }
    public double? LatestChapterNumber { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<GenreDto> Categories { get; set; } = new();
    public List<ChapterBriefDto> Chapters { get; set; } = new();
}

public class HomeFeedDto
{
    public List<ComicCardDto> Hot { get; set; } = new();
    public List<ComicCardDto> Latest { get; set; } = new();
}

public class GenreDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ComicCount { get; set; } = 0;
}

public class CreateGenreDto
{
    [Required]
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? Description { get; set; }
}

public class UpdateGenreDto
{
    public string? Name { get; set; }
    public string? Slug { get; set; }
    public string? Description { get; set; }
}

public class CreateComicDto
{
    [Required]
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? OtherNames { get; set; }
    public string? Author { get; set; }
    public ComicStatus Status { get; set; } = ComicStatus.ONGOING;
    [Required]
    public string CoverImage { get; set; } = string.Empty;
    public string? BannerImage { get; set; }
    public string? Description { get; set; }
    public List<string> CategoryIds { get; set; } = new();
}

public class UpdateComicDto
{
    public string? Title { get; set; }
    public string? Slug { get; set; }
    public string? OtherNames { get; set; }
    public string? Author { get; set; }
    public ComicStatus? Status { get; set; }
    public string? CoverImage { get; set; }
    public string? BannerImage { get; set; }
    public string? Description { get; set; }
    public List<string>? CategoryIds { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PerPage { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)Total / Math.Max(1, PerPage));
}
