using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TruyenKomi.Application.Common;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;

namespace TruyenKomi.Application.Services;

public class SearchService : ISearchService
{
    private readonly IAppDbContext _db;

    public SearchService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<ComicCardDto>> SearchComicsAsync(string query, int limit, int offset)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new PagedResult<ComicCardDto>
            {
                Items = new List<ComicCardDto>(),
                Total = 0,
                Page = (offset / Math.Max(1, limit)) + 1,
                PerPage = limit
            };
        }

        var unaccentQuery = TextNormalizer.ToUnaccent(query);
        var pattern = $"%{unaccentQuery}%";
        var rawPattern = $"%{query.Trim().ToLower()}%";

        var baseQuery = _db.Comics
            .AsNoTracking()
            .Where(c => EF.Functions.ILike(c.TitleUnaccent, pattern) 
                     || EF.Functions.ILike(c.Title, rawPattern)
                     || (c.OtherNames != null && EF.Functions.ILike(c.OtherNames, rawPattern))
                     || (c.Author != null && EF.Functions.ILike(c.Author, rawPattern)));

        var total = await baseQuery.CountAsync();
        var items = await baseQuery
            .OrderByDescending(c => c.Views)
            .Skip(offset)
            .Take(limit)
            .Include(c => c.Categories).ThenInclude(cc => cc.Category)
            .Select(c => ComicService.MapToCardDto(c))
            .ToListAsync();

        return new PagedResult<ComicCardDto>
        {
            Items = items,
            Total = total,
            Page = (offset / Math.Max(1, limit)) + 1,
            PerPage = limit
        };
    }

    public async Task<List<ComicCardDto>> QuickSuggestAsync(string query, int limit)
    {
        if (string.IsNullOrWhiteSpace(query)) return new List<ComicCardDto>();

        var unaccentQuery = TextNormalizer.ToUnaccent(query);
        var pattern = $"%{unaccentQuery}%";
        var rawPattern = $"%{query.Trim().ToLower()}%";

        return await _db.Comics
            .AsNoTracking()
            .Where(c => EF.Functions.ILike(c.TitleUnaccent, pattern) 
                     || EF.Functions.ILike(c.Title, rawPattern))
            .OrderByDescending(c => c.Views)
            .Take(limit)
            .Include(c => c.Categories).ThenInclude(cc => cc.Category)
            .Select(c => ComicService.MapToCardDto(c))
            .ToListAsync();
    }
}
