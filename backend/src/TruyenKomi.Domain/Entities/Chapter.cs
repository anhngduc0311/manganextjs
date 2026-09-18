using System;
using System.Collections.Generic;

namespace TruyenKomi.Domain.Entities;

public class Chapter
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ComicId { get; set; } = string.Empty;
    public Comic Comic { get; set; } = null!;

    public double ChapterNumber { get; set; }
    public string? Title { get; set; }
    public long Views { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ChapterPage> Pages { get; set; } = new List<ChapterPage>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Report> Reports { get; set; } = new List<Report>();
    public ICollection<History> Histories { get; set; } = new List<History>();
    public ICollection<ReadingReward> ReadingRewards { get; set; } = new List<ReadingReward>();
}

public class ChapterPage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ChapterId { get; set; } = string.Empty;
    public Chapter Chapter { get; set; } = null!;

    public int PageIndex { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
}
