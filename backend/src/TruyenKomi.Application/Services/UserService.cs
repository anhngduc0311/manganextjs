using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TruyenKomi.Application.Common;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Domain.Entities;
using TruyenKomi.Domain.Enums;

namespace TruyenKomi.Application.Services;

public class UserService : IUserService
{
    private readonly IAppDbContext _db;

    public UserService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<UserDto> GetProfileAsync(string userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) throw new KeyNotFoundException("Không tìm thấy người dùng.");

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            Avatar = user.Avatar,
            Exp = user.Exp,
            Level = user.Level,
            DailyStreak = user.DailyStreak
        };
    }

    public async Task<UserDto> UpdateProfileAsync(string userId, UpdateProfileDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) throw new KeyNotFoundException("Không tìm thấy người dùng.");

        if (!string.IsNullOrWhiteSpace(dto.Avatar))
        {
            user.Avatar = dto.Avatar;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            Avatar = user.Avatar,
            Exp = user.Exp,
            Level = user.Level,
            DailyStreak = user.DailyStreak
        };
    }

    public async Task<PagedResult<FollowItemDto>> GetFollowsAsync(string userId, int page, int perPage)
    {
        var query = _db.Follows
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.Comic.UpdatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * perPage)
            .Take(perPage)
            .Select(f => new FollowItemDto
            {
                ComicId = f.ComicId,
                ComicTitle = f.Comic.Title,
                ComicSlug = f.Comic.Slug,
                ComicCover = f.Comic.CoverImage,
                LatestChapterNumber = f.Comic.LatestChapterNumber,
                FollowedAt = f.CreatedAt,
                ComicUpdatedAt = f.Comic.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<FollowItemDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PerPage = perPage
        };
    }

    public async Task<bool> ToggleFollowAsync(string userId, string comicId)
    {
        var follow = await _db.Follows.FirstOrDefaultAsync(f => f.UserId == userId && f.ComicId == comicId);
        if (follow != null)
        {
            _db.Follows.Remove(follow);
            await _db.SaveChangesAsync();
            return false; // Unfollowed
        }

        _db.Follows.Add(new Follow
        {
            UserId = userId,
            ComicId = comicId,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return true; // Followed
    }

    public async Task<bool> IsFollowingAsync(string userId, string comicId)
    {
        return await _db.Follows.AnyAsync(f => f.UserId == userId && f.ComicId == comicId);
    }

    public async Task<PagedResult<HistoryItemDto>> GetHistoryAsync(string userId, int page, int perPage)
    {
        var query = _db.Histories
            .AsNoTracking()
            .Where(h => h.UserId == userId)
            .OrderByDescending(h => h.UpdatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * perPage)
            .Take(perPage)
            .Select(h => new HistoryItemDto
            {
                ComicId = h.ComicId,
                ComicTitle = h.Comic.Title,
                ComicSlug = h.Comic.Slug,
                ComicCover = h.Comic.CoverImage,
                ChapterId = h.ChapterId,
                ChapterNumber = h.Chapter.ChapterNumber,
                ChapterTitle = h.Chapter.Title,
                LastReadPage = h.LastReadPage,
                UpdatedAt = h.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<HistoryItemDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PerPage = perPage
        };
    }

    public async Task<bool> RecordHistoryAsync(string userId, RecordHistoryDto dto)
    {
        var history = await _db.Histories.FirstOrDefaultAsync(h => h.UserId == userId && h.ComicId == dto.ComicId);
        if (history == null)
        {
            history = new History
            {
                UserId = userId,
                ComicId = dto.ComicId,
                ChapterId = dto.ChapterId,
                LastReadPage = dto.LastReadPage,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Histories.Add(history);
        }
        else
        {
            history.ChapterId = dto.ChapterId;
            history.LastReadPage = dto.LastReadPage;
            history.UpdatedAt = DateTime.UtcNow;
        }

        // Reading Reward (+5 EXP per unique chapter)
        var rewardGiven = await _db.ReadingRewards.AnyAsync(r => r.UserId == userId && r.ChapterId == dto.ChapterId);
        if (!rewardGiven)
        {
            _db.ReadingRewards.Add(new ReadingReward
            {
                UserId = userId,
                ChapterId = dto.ChapterId,
                CreatedAt = DateTime.UtcNow
            });

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null)
            {
                user.Exp += GamificationUtils.ExpPerChapter;
                user.Level = GamificationUtils.ComputeLevel(user.Exp);
                user.LastActiveAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<PagedResult<UserDto>> ListUsersAdminAsync(int page, int perPage, string search, Role? role)
    {
        var query = _db.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u => u.Username.ToLower().Contains(s) || u.Email.ToLower().Contains(s));
        }

        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        query = query.OrderByDescending(u => u.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * perPage)
            .Take(perPage)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role,
                Avatar = u.Avatar,
                Exp = u.Exp,
                Level = u.Level,
                DailyStreak = u.DailyStreak
            })
            .ToListAsync();

        return new PagedResult<UserDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PerPage = perPage
        };
    }

    public async Task<UserDto> UpdateUserRoleAsync(string adminUserId, string targetUserId, Role role)
    {
        var targetUser = await _db.Users.FirstOrDefaultAsync(u => u.Id == targetUserId);
        if (targetUser == null) throw new KeyNotFoundException("Không tìm thấy người dùng.");

        targetUser.Role = role;
        targetUser.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new UserDto
        {
            Id = targetUser.Id,
            Username = targetUser.Username,
            Email = targetUser.Email,
            Role = targetUser.Role,
            Avatar = targetUser.Avatar,
            Exp = targetUser.Exp,
            Level = targetUser.Level,
            DailyStreak = targetUser.DailyStreak
        };
    }
}
