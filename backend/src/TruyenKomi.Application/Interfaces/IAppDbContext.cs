using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TruyenKomi.Domain.Entities;

namespace TruyenKomi.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Comic> Comics { get; }
    DbSet<Category> Categories { get; }
    DbSet<ComicCategory> ComicCategories { get; }
    DbSet<Chapter> Chapters { get; }
    DbSet<ChapterPage> ChapterPages { get; }
    DbSet<Comment> Comments { get; }
    DbSet<Follow> Follows { get; }
    DbSet<History> Histories { get; }
    DbSet<ReadingReward> ReadingRewards { get; }
    DbSet<ComicRating> ComicRatings { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<Report> Reports { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IJwtTokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}

public interface ICrawlerQueue
{
    ValueTask EnqueueAsync(DTOs.IngestPayloadDto payload);
    System.Collections.Generic.IAsyncEnumerable<DTOs.IngestPayloadDto> ReadAllAsync(CancellationToken cancellationToken);
}
