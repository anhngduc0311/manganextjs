using System;
using System.ComponentModel.DataAnnotations;
using TruyenKomi.Domain.Enums;

namespace TruyenKomi.Application.DTOs;

public class UpdateProfileDto
{
    public string? Avatar { get; set; }
}

public class RecordHistoryDto
{
    [Required]
    public string ComicId { get; set; } = string.Empty;
    [Required]
    public string ChapterId { get; set; } = string.Empty;
    public int LastReadPage { get; set; } = 1;
}

public class HistoryItemDto
{
    public string ComicId { get; set; } = string.Empty;
    public string ComicTitle { get; set; } = string.Empty;
    public string ComicSlug { get; set; } = string.Empty;
    public string ComicCover { get; set; } = string.Empty;
    public string ChapterId { get; set; } = string.Empty;
    public double ChapterNumber { get; set; }
    public string? ChapterTitle { get; set; }
    public int LastReadPage { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class FollowItemDto
{
    public string ComicId { get; set; } = string.Empty;
    public string ComicTitle { get; set; } = string.Empty;
    public string ComicSlug { get; set; } = string.Empty;
    public string ComicCover { get; set; } = string.Empty;
    public double? LatestChapterNumber { get; set; }
    public DateTime FollowedAt { get; set; }
    public DateTime ComicUpdatedAt { get; set; }
}

public class UpdateRoleDto
{
    [Required]
    public Role Role { get; set; }
}

public class RateComicDto
{
    [Required]
    public string ComicId { get; set; } = string.Empty;
    [Required]
    [Range(1, 5)]
    public int Score { get; set; }
}

public class CreateReportDto
{
    [Required]
    public string ChapterId { get; set; } = string.Empty;
    [Required]
    public string Reason { get; set; } = string.Empty;
}

public class ResolveReportDto
{
    [Required]
    public string Status { get; set; } = "RESOLVED"; // RESOLVED, REJECTED
}

public class ReportDto
{
    public string Id { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? Username { get; set; }
    public string ChapterId { get; set; } = string.Empty;
    public double ChapterNumber { get; set; }
    public string ComicId { get; set; } = string.Empty;
    public string ComicTitle { get; set; } = string.Empty;
    public string ComicSlug { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING";
    public DateTime CreatedAt { get; set; }
}

public class NotificationDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RecordViewDto
{
    public string ComicId { get; set; } = string.Empty;
    public string? ChapterId { get; set; }
}

public class GetUploadUrlDto
{
    [Required]
    public string Filename { get; set; } = string.Empty;
    [Required]
    public string ContentType { get; set; } = string.Empty;
}

public class PresignedUrlResponse
{
    public string UploadUrl { get; set; } = string.Empty;
    public string PublicUrl { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
}
