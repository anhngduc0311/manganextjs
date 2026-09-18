using System;
using System.Collections.Generic;
using TruyenKomi.Domain.Enums;

namespace TruyenKomi.Domain.Entities;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public Role Role { get; set; } = Role.USER;
    public string? Avatar { get; set; }
    public int Exp { get; set; } = 0;
    public int Level { get; set; } = 1;
    public int DailyStreak { get; set; } = 0;
    public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshExpiry { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<ComicRating> Ratings { get; set; } = new List<ComicRating>();
    public ICollection<Follow> Follows { get; set; } = new List<Follow>();
    public ICollection<History> Histories { get; set; } = new List<History>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<Report> Reports { get; set; } = new List<Report>();
    public ICollection<ReadingReward> ReadingRewards { get; set; } = new List<ReadingReward>();
}
