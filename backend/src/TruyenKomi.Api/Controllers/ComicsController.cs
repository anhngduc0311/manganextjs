using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Domain.Enums;

namespace TruyenKomi.Api.Controllers;

[ApiController]
[Route("api/comics")]
public class ComicsController : ControllerBase
{
    private readonly IComicService _comicService;

    public ComicsController(IComicService comicService)
    {
        _comicService = comicService;
    }

    [HttpGet("home-feed")]
    public async Task<IActionResult> GetHomeFeed()
    {
        var feed = await _comicService.GetHomeFeedAsync();
        return Ok(feed);
    }

    [HttpGet("ranking")]
    public async Task<IActionResult> GetRankings([FromQuery] string period = "daily")
    {
        var list = await _comicService.GetRankingsAsync(period);
        return Ok(list);
    }

    [HttpGet("genres")]
    public async Task<IActionResult> ListCategories()
    {
        var list = await _comicService.ListCategoriesAsync();
        return Ok(list);
    }

    [HttpGet]
    public async Task<IActionResult> ListComics(
        [FromQuery] List<string>? genres,
        [FromQuery] ComicStatus? status,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int perPage = 24)
    {
        var result = await _comicService.ListComicsAsync(genres, status, sort, page, perPage);
        return Ok(result);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var comic = await _comicService.GetBySlugAsync(slug);
        return comic != null ? Ok(comic) : NotFound(new { message = "Không tìm thấy truyện." });
    }

    // --- ADMIN ENDPOINTS ---
    [Authorize(Roles = "ADMIN,MODERATOR")]
    [HttpPost]
    public async Task<IActionResult> CreateComic([FromBody] CreateComicDto dto)
    {
        var comic = await _comicService.CreateComicAsync(dto);
        return CreatedAtAction(nameof(GetBySlug), new { slug = comic.Slug }, comic);
    }

    [Authorize(Roles = "ADMIN,MODERATOR")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateComic(string id, [FromBody] UpdateComicDto dto)
    {
        var comic = await _comicService.UpdateComicAsync(id, dto);
        return Ok(comic);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteComic(string id)
    {
        var success = await _comicService.DeleteComicAsync(id);
        return success ? Ok(new { success = true }) : NotFound();
    }

    [Authorize(Roles = "ADMIN,MODERATOR")]
    [HttpPost("genres")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateGenreDto dto)
    {
        var genre = await _comicService.CreateCategoryAsync(dto);
        return Ok(genre);
    }

    [Authorize(Roles = "ADMIN,MODERATOR")]
    [HttpPut("genres/{id}")]
    public async Task<IActionResult> UpdateCategory(string id, [FromBody] UpdateGenreDto dto)
    {
        var genre = await _comicService.UpdateCategoryAsync(id, dto);
        return Ok(genre);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpDelete("genres/{id}")]
    public async Task<IActionResult> DeleteCategory(string id)
    {
        var success = await _comicService.DeleteCategoryAsync(id);
        return success ? Ok(new { success = true }) : NotFound();
    }
}
