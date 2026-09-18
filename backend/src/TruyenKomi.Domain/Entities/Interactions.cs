using System;

namespace TruyenKomi.Domain.Entities;

public class Follow
{
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;

    public string ComicId { get; set; } = string.Empty;
    public Comic Comic { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class History
{
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;

    public string ComicId { get; set; } = string.Empty;
    public Comic Comic { get; set; } = null!;

    public string ChapterId { get; set; } = string.Empty;
    public Chapter Chapter { get; set; } = null!;

    public int LastReadPage { get; set; } = 1;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ReadingReward
{
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;

    public string ChapterId { get; set; } = string.Empty;
    public Chapter Chapter { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ComicRating
{
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;

    public string ComicId { get; set; } = string.Empty;
    public Comic Comic { get; set; } = null!;

    public int Score { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Notification
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Report
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string? UserId { get; set; }
    public User? User { get; set; }

    public string ChapterId { get; set; } = string.Empty;
    public Chapter Chapter { get; set; } = null!;

    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING"; // PENDING, RESOLVED, REJECTED
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
