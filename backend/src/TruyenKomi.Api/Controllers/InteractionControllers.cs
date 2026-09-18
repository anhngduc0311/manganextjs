using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;

namespace TruyenKomi.Api.Controllers;

[ApiController]
[Route("api/chapters")]
public class ChaptersController : ControllerBase
{
    private readonly IChapterService _chapterService;

    public ChaptersController(IChapterService chapterService)
    {
        _chapterService = chapterService;
    }

    [HttpGet("reader/{comicSlug}/{chapterNumber}")]
    public async Task<IActionResult> GetReaderData(string comicSlug, double chapterNumber)
    {
        var data = await _chapterService.GetReaderDataAsync(comicSlug, chapterNumber);
        return data != null ? Ok(data) : NotFound(new { message = "Không tìm thấy chương truyện." });
    }

    [HttpGet("comic/{comicId}")]
    public async Task<IActionResult> ListChaptersByComicId(string comicId)
    {
        var list = await _chapterService.ListChaptersByComicIdAsync(comicId);
        return Ok(list);
    }

    [Authorize(Roles = "ADMIN,MODERATOR")]
    [HttpGet("admin/comic/{comicId}")]
    public async Task<IActionResult> ListChaptersAdmin(string comicId)
    {
        var list = await _chapterService.ListChaptersAdminAsync(comicId);
        return Ok(list);
    }

    [Authorize(Roles = "ADMIN,MODERATOR")]
    [HttpPost]
    public async Task<IActionResult> UpsertChapter([FromBody] UpsertChapterDto dto)
    {
        var chapter = await _chapterService.UpsertChapterAsync(dto);
        return Ok(chapter);
    }

    [Authorize(Roles = "ADMIN,MODERATOR")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteChapter(string id)
    {
        var success = await _chapterService.DeleteChapterAsync(id);
        return success ? Ok(new { success = true }) : NotFound();
    }
}

[ApiController]
[Route("api/comments")]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string comicId,
        [FromQuery] string? chapterId,
        [FromQuery] int page = 1,
        [FromQuery] int perPage = 20)
    {
        var result = await _commentService.ListAsync(comicId, chapterId, page, perPage);
        return Ok(result);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCommentDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var comment = await _commentService.CreateAsync(userId, dto);
        return Ok(comment);
    }

    [HttpPost("{id}/like")]
    public async Task<IActionResult> Like(string id)
    {
        var likes = await _commentService.LikeAsync(id);
        return Ok(new { likes });
    }

    [Authorize(Roles = "ADMIN,MODERATOR")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Remove(string id)
    {
        var success = await _commentService.RemoveAsync(id);
        return success ? Ok(new { success = true }) : NotFound();
    }

    [Authorize(Roles = "ADMIN,MODERATOR")]
    [HttpGet("admin/moderation")]
    public async Task<IActionResult> ListForModeration(
        [FromQuery] int page = 1,
        [FromQuery] int perPage = 30,
        [FromQuery] string search = "")
    {
        var result = await _commentService.ListForModerationAsync(page, perPage, search);
        return Ok(result);
    }
}

[ApiController]
[Route("api/ratings")]
public class RatingsController : ControllerBase
{
    private readonly IRatingService _ratingService;

    public RatingsController(IRatingService ratingService)
    {
        _ratingService = ratingService;
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> RateComic([FromBody] RateComicDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var newRatingAvg = await _ratingService.RateComicAsync(userId, dto);
        return Ok(new { ratingAvg = newRatingAvg });
    }

    [Authorize]
    [HttpGet("{comicId}/me")]
    public async Task<IActionResult> GetUserRating(string comicId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var score = await _ratingService.GetUserRatingAsync(userId, comicId);
        return Ok(new { score });
    }
}
