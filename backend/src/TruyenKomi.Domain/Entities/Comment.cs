using System;
using System.Collections.Generic;

namespace TruyenKomi.Domain.Entities;

public class Comment
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Content { get; set; } = string.Empty;
    public bool IsSpoiler { get; set; } = false;
    public int Likes { get; set; } = 0;

    public string UserId { get; set; } = string.Empty;
    public User? User { get; set; }

    public string ComicId { get; set; } = string.Empty;
    public Comic Comic { get; set; } = null!;

    public string? ChapterId { get; set; }
    public Chapter? Chapter { get; set; }

    public string? ParentId { get; set; }
    public Comment? Parent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Comment> Replies { get; set; } = new List<Comment>();
}
