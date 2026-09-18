using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TruyenKomi.Application.Common;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Domain.Entities;

namespace TruyenKomi.Application.Services;

public class CommentService : ICommentService
{
    private readonly IAppDbContext _db;

    public CommentService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<CommentDto>> ListAsync(string comicId, string? chapterId, int page, int perPage)
    {
        var query = _db.Comments
            .AsNoTracking()
            .Where(c => c.ComicId == comicId && c.ParentId == null);

        if (!string.IsNullOrWhiteSpace(chapterId))
        {
            query = query.Where(c => c.ChapterId == chapterId);
        }

        query = query.OrderByDescending(c => c.CreatedAt);

        var total = await query.CountAsync();
        var rootComments = await query
            .Skip((page - 1) * perPage)
            .Take(perPage)
            .Include(c => c.User)
            .Include(c => c.Replies).ThenInclude(r => r.User)
            .ToListAsync();

        var items = rootComments.Select(c => new CommentDto
        {
            Id = c.Id,
            Content = c.Content,
            IsSpoiler = c.IsSpoiler,
            Likes = c.Likes,
            UserId = c.UserId,
            User = c.User != null ? new CommentUserDto
            {
                Id = c.User.Id,
                Username = c.User.Username,
                Avatar = c.User.Avatar,
                Level = c.User.Level
            } : null,
            ComicId = c.ComicId,
            ChapterId = c.ChapterId,
            ParentId = c.ParentId,
            CreatedAt = c.CreatedAt,
            Replies = c.Replies.OrderBy(r => r.CreatedAt).Select(r => new CommentDto
            {
                Id = r.Id,
                Content = r.Content,
                IsSpoiler = r.IsSpoiler,
                Likes = r.Likes,
                UserId = r.UserId,
                User = r.User != null ? new CommentUserDto
                {
                    Id = r.User.Id,
                    Username = r.User.Username,
                    Avatar = r.User.Avatar,
                    Level = r.User.Level
                } : null,
                ComicId = r.ComicId,
                ChapterId = r.ChapterId,
                ParentId = r.ParentId,
                CreatedAt = r.CreatedAt
            }).ToList()
        }).ToList();

        return new PagedResult<CommentDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PerPage = perPage
        };
    }

    public async Task<CommentDto> CreateAsync(string userId, CreateCommentDto dto)
    {
        var content = dto.Content.Trim();
        var isSpoiler = dto.IsSpoiler || content.Contains("[spoil]") || content.Contains("[spoiler]");

        var comment = new Comment
        {
            Content = content,
            IsSpoiler = isSpoiler,
            UserId = userId,
            ComicId = dto.ComicId,
            ChapterId = dto.ChapterId,
            ParentId = dto.ParentId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Comments.Add(comment);

        // Award EXP
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user != null)
        {
            user.Exp += GamificationUtils.ExpPerComment;
            user.Level = GamificationUtils.ComputeLevel(user.Exp);
            user.LastActiveAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return new CommentDto
        {
            Id = comment.Id,
            Content = comment.Content,
            IsSpoiler = comment.IsSpoiler,
            Likes = comment.Likes,
            UserId = comment.UserId,
            User = user != null ? new CommentUserDto
            {
                Id = user.Id,
                Username = user.Username,
                Avatar = user.Avatar,
                Level = user.Level
            } : null,
            ComicId = comment.ComicId,
            ChapterId = comment.ChapterId,
            ParentId = comment.ParentId,
            CreatedAt = comment.CreatedAt
        };
    }

    public async Task<int> LikeAsync(string commentId)
    {
        var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == commentId);
        if (comment == null) return 0;

        comment.Likes += 1;
        await _db.SaveChangesAsync();
        return comment.Likes;
    }

    public async Task<bool> RemoveAsync(string commentId)
    {
        var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == commentId);
        if (comment == null) return false;

        _db.Comments.Remove(comment);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<PagedResult<CommentDto>> ListForModerationAsync(int page, int perPage, string search)
    {
        var query = _db.Comments.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(c => c.Content.ToLower().Contains(search.ToLower()));
        }

        query = query.OrderByDescending(c => c.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * perPage)
            .Take(perPage)
            .Include(c => c.User)
            .Select(c => new CommentDto
            {
                Id = c.Id,
                Content = c.Content,
                IsSpoiler = c.IsSpoiler,
                Likes = c.Likes,
                UserId = c.UserId,
                User = c.User != null ? new CommentUserDto
                {
                    Id = c.User.Id,
                    Username = c.User.Username,
                    Avatar = c.User.Avatar,
                    Level = c.User.Level
                } : null,
                ComicId = c.ComicId,
                ChapterId = c.ChapterId,
                ParentId = c.ParentId,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<CommentDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PerPage = perPage
        };
    }
}
