using System;
using System.Collections.Generic;
using TruyenKomi.Domain.Enums;

namespace TruyenKomi.Domain.Entities;

public class Comic
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string TitleUnaccent { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? OtherNames { get; set; }
    public string? Author { get; set; }
    public ComicStatus Status { get; set; } = ComicStatus.ONGOING;
    public string CoverImage { get; set; } = string.Empty;
    public string? BannerImage { get; set; }
    public string? Description { get; set; }
    public long Views { get; set; } = 0;
    public long MonthlyViews { get; set; } = 0;
    public long WeeklyViews { get; set; } = 0;
    public double RatingAvg { get; set; } = 0.0;
    public int RatingCount { get; set; } = 0;
    public int ChapterCount { get; set; } = 0;
    public double? LatestChapterNumber { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
    public ICollection<ComicCategory> Categories { get; set; } = new List<ComicCategory>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<ComicRating> Ratings { get; set; } = new List<ComicRating>();
    public ICollection<Follow> Follows { get; set; } = new List<Follow>();
    public ICollection<History> Histories { get; set; } = new List<History>();
}
