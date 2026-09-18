using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TruyenKomi.Application.DTOs;

public class ChapterPageDto
{
    public string Id { get; set; } = string.Empty;
    public int PageIndex { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
}

public class ChapterDetailDto
{
    public string Id { get; set; } = string.Empty;
    public string ComicId { get; set; } = string.Empty;
    public double ChapterNumber { get; set; }
    public string? Title { get; set; }
    public long Views { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ChapterPageDto> Pages { get; set; } = new();
}

public class ReaderDataDto
{
    public ComicCardDto Comic { get; set; } = null!;
    public ChapterDetailDto Chapter { get; set; } = null!;
    public List<ChapterPageDto> Pages { get; set; } = new();
    public double? PrevChapterNumber { get; set; }
    public double? NextChapterNumber { get; set; }
}

public class UpsertChapterDto
{
    public string? Id { get; set; }
    [Required]
    public string ComicId { get; set; } = string.Empty;
    [Required]
    public double ChapterNumber { get; set; }
    public string? Title { get; set; }
    public List<string> PageUrls { get; set; } = new();
}
