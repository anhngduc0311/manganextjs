using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using TruyenKomi.Domain.Enums;

namespace TruyenKomi.Application.DTOs;

public class IngestComicDto
{
    [Required]
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? OtherNames { get; set; }
    public string? Author { get; set; }
    public ComicStatus Status { get; set; } = ComicStatus.ONGOING;
    public string? CoverImage { get; set; }
    public string? BannerImage { get; set; }
    public string? Description { get; set; }
    public List<string> Categories { get; set; } = new();
}

public class IngestChapterDto
{
    [Required]
    public double ChapterNumber { get; set; }
    public string? Title { get; set; }
    public List<string> Pages { get; set; } = new();
}

public class IngestPayloadDto
{
    [Required]
    public IngestComicDto Comic { get; set; } = null!;
    public List<IngestChapterDto> Chapters { get; set; } = new();
}
