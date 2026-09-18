using System;
using System.Collections.Generic;

namespace TruyenKomi.Domain.Entities;

public class Category
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<ComicCategory> Comics { get; set; } = new List<ComicCategory>();
}

public class ComicCategory
{
    public string ComicId { get; set; } = string.Empty;
    public Comic Comic { get; set; } = null!;

    public string CategoryId { get; set; } = string.Empty;
    public Category Category { get; set; } = null!;
}
