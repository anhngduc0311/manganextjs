using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TruyenKomi.Application.DTOs;

public class CommentUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public int Level { get; set; }
}

public class CommentDto
{
    public string Id { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsSpoiler { get; set; }
    public int Likes { get; set; }
    public string UserId { get; set; } = string.Empty;
    public CommentUserDto? User { get; set; }
    public string ComicId { get; set; } = string.Empty;
    public string? ChapterId { get; set; }
    public string? ParentId { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<CommentDto> Replies { get; set; } = new();
}

public class CreateCommentDto
{
    [Required]
    public string ComicId { get; set; } = string.Empty;
    public string? ChapterId { get; set; }
    public string? ParentId { get; set; }
    [Required]
    [MinLength(1)]
    public string Content { get; set; } = string.Empty;
    public bool IsSpoiler { get; set; } = false;
}
