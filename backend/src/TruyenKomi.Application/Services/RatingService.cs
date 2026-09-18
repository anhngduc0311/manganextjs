using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TruyenKomi.Application.Common;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Domain.Entities;

namespace TruyenKomi.Application.Services;

public class RatingService : IRatingService
{
    private readonly IAppDbContext _db;

    public RatingService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<double> RateComicAsync(string userId, RateComicDto dto)
    {
        var comic = await _db.Comics.FirstOrDefaultAsync(c => c.Id == dto.ComicId);
        if (comic == null) throw new KeyNotFoundException("Không tìm thấy truyện.");

        var existingRating = await _db.ComicRatings
            .FirstOrDefaultAsync(r => r.UserId == userId && r.ComicId == dto.ComicId);

        if (existingRating == null)
        {
            existingRating = new ComicRating
            {
                UserId = userId,
                ComicId = dto.ComicId,
                Score = dto.Score,
                CreatedAt = DateTime.UtcNow
            };
            _db.ComicRatings.Add(existingRating);

            // Award EXP on first rate
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null)
            {
                user.Exp += GamificationUtils.ExpPerRating;
                user.Level = GamificationUtils.ComputeLevel(user.Exp);
                user.LastActiveAt = DateTime.UtcNow;
            }
        }
        else
        {
            existingRating.Score = dto.Score;
        }

        await _db.SaveChangesAsync();

        // Recalculate average and count
        var ratings = await _db.ComicRatings
            .Where(r => r.ComicId == dto.ComicId)
            .Select(r => r.Score)
            .ToListAsync();

        comic.RatingCount = ratings.Count;
        comic.RatingAvg = ratings.Count > 0 ? Math.Round(ratings.Average(), 1) : 0.0;

        await _db.SaveChangesAsync();

        return comic.RatingAvg;
    }

    public async Task<int?> GetUserRatingAsync(string userId, string comicId)
    {
        var rating = await _db.ComicRatings
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.UserId == userId && r.ComicId == comicId);

        return rating?.Score;
    }
}
