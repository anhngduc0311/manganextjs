using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Domain.Entities;
using TruyenKomi.Domain.Enums;

namespace TruyenKomi.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Comic> Comics => Set<Comic>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<ComicCategory> ComicCategories => Set<ComicCategory>();
    public DbSet<Chapter> Chapters => Set<Chapter>();
    public DbSet<ChapterPage> ChapterPages => Set<ChapterPage>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Follow> Follows => Set<Follow>();
    public DbSet<History> Histories => Set<History>();
    public DbSet<ReadingReward> ReadingRewards => Set<ReadingReward>();
    public DbSet<ComicRating> ComicRatings => Set<ComicRating>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Report> Reports => Set<Report>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Map Table Names to match Prisma
        modelBuilder.Entity<User>().ToTable("User");
        modelBuilder.Entity<Comic>().ToTable("Comic");
        modelBuilder.Entity<Category>().ToTable("Category");
        modelBuilder.Entity<ComicCategory>().ToTable("ComicCategory");
        modelBuilder.Entity<Chapter>().ToTable("Chapter");
        modelBuilder.Entity<ChapterPage>().ToTable("ChapterPage");
        modelBuilder.Entity<Comment>().ToTable("Comment");
        modelBuilder.Entity<Follow>().ToTable("Follow");
        modelBuilder.Entity<History>().ToTable("History");
        modelBuilder.Entity<ReadingReward>().ToTable("ReadingReward");
        modelBuilder.Entity<ComicRating>().ToTable("ComicRating");
        modelBuilder.Entity<Notification>().ToTable("Notification");
        modelBuilder.Entity<Report>().ToTable("Report");

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Username).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>();
        });

        // Comic
        modelBuilder.Entity<Comic>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.HasIndex(c => c.Slug).IsUnique();
            entity.HasIndex(c => c.TitleUnaccent);
            entity.HasIndex(c => c.Views);
            entity.HasIndex(c => c.UpdatedAt);
            entity.Property(c => c.Status).HasConversion<string>();
        });

        // Category
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.HasIndex(c => c.Name).IsUnique();
            entity.HasIndex(c => c.Slug).IsUnique();
        });

        // ComicCategory (Composite Key)
        modelBuilder.Entity<ComicCategory>(entity =>
        {
            entity.HasKey(cc => new { cc.ComicId, cc.CategoryId });

            entity.HasOne(cc => cc.Comic)
                .WithMany(c => c.Categories)
                .HasForeignKey(cc => cc.ComicId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cc => cc.Category)
                .WithMany(c => c.Comics)
                .HasForeignKey(cc => cc.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Chapter
        modelBuilder.Entity<Chapter>(entity =>
        {
            entity.HasKey(ch => ch.Id);
            entity.HasIndex(ch => new { ch.ComicId, ch.ChapterNumber }).IsUnique();

            entity.HasOne(ch => ch.Comic)
                .WithMany(c => c.Chapters)
                .HasForeignKey(ch => ch.ComicId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ChapterPage
        modelBuilder.Entity<ChapterPage>(entity =>
        {
            entity.HasKey(cp => cp.Id);
            entity.HasIndex(cp => new { cp.ChapterId, cp.PageIndex }).IsUnique();

            entity.HasOne(cp => cp.Chapter)
                .WithMany(ch => ch.Pages)
                .HasForeignKey(cp => cp.ChapterId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Comment
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.HasIndex(c => new { c.ComicId, c.CreatedAt });
            entity.HasIndex(c => c.ChapterId);

            entity.HasOne(c => c.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Comic)
                .WithMany(co => co.Comments)
                .HasForeignKey(c => c.ComicId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Chapter)
                .WithMany(ch => ch.Comments)
                .HasForeignKey(c => c.ChapterId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Parent)
                .WithMany(p => p.Replies)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Follow (Composite Key)
        modelBuilder.Entity<Follow>(entity =>
        {
            entity.HasKey(f => new { f.UserId, f.ComicId });

            entity.HasOne(f => f.User)
                .WithMany(u => u.Follows)
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(f => f.Comic)
                .WithMany(c => c.Follows)
                .HasForeignKey(f => f.ComicId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // History (Composite Key)
        modelBuilder.Entity<History>(entity =>
        {
            entity.HasKey(h => new { h.UserId, h.ComicId });

            entity.HasOne(h => h.User)
                .WithMany(u => u.Histories)
                .HasForeignKey(h => h.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(h => h.Comic)
                .WithMany(c => c.Histories)
                .HasForeignKey(h => h.ComicId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(h => h.Chapter)
                .WithMany(ch => ch.Histories)
                .HasForeignKey(h => h.ChapterId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ReadingReward (Composite Key)
        modelBuilder.Entity<ReadingReward>(entity =>
        {
            entity.HasKey(r => new { r.UserId, r.ChapterId });

            entity.HasOne(r => r.User)
                .WithMany(u => u.ReadingRewards)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(r => r.Chapter)
                .WithMany(ch => ch.ReadingRewards)
                .HasForeignKey(r => r.ChapterId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ComicRating (Composite Key)
        modelBuilder.Entity<ComicRating>(entity =>
        {
            entity.HasKey(cr => new { cr.UserId, cr.ComicId });

            entity.HasOne(cr => cr.User)
                .WithMany(u => u.Ratings)
                .HasForeignKey(cr => cr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cr => cr.Comic)
                .WithMany(c => c.Ratings)
                .HasForeignKey(cr => cr.ComicId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Notification
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.HasIndex(n => new { n.UserId, n.IsRead });

            entity.HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Report
        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.HasIndex(r => r.Status);

            entity.HasOne(r => r.User)
                .WithMany(u => u.Reports)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(r => r.Chapter)
                .WithMany(ch => ch.Reports)
                .HasForeignKey(r => r.ChapterId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
