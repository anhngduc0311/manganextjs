using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Domain.Enums;

namespace TruyenKomi.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var profile = await _userService.GetProfileAsync(userId);
        return Ok(profile);
    }

    [Authorize]
    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var profile = await _userService.UpdateProfileAsync(userId, dto);
        return Ok(profile);
    }

    [Authorize]
    [HttpGet("follows")]
    public async Task<IActionResult> GetFollows([FromQuery] int page = 1, [FromQuery] int perPage = 20)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var result = await _userService.GetFollowsAsync(userId, page, perPage);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("follows/{comicId}")]
    public async Task<IActionResult> ToggleFollow(string comicId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var isFollowing = await _userService.ToggleFollowAsync(userId, comicId);
        return Ok(new { following = isFollowing });
    }

    [Authorize]
    [HttpGet("follows/{comicId}/status")]
    public async Task<IActionResult> IsFollowing(string comicId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var isFollowing = await _userService.IsFollowingAsync(userId, comicId);
        return Ok(new { following = isFollowing });
    }

    [Authorize]
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int page = 1, [FromQuery] int perPage = 20)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var result = await _userService.GetHistoryAsync(userId, page, perPage);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("history")]
    public async Task<IActionResult> RecordHistory([FromBody] RecordHistoryDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var success = await _userService.RecordHistoryAsync(userId, dto);
        return Ok(new { success });
    }

    // --- ADMIN USER MANAGEMENT ---
    [Authorize(Roles = "ADMIN,MODERATOR")]
    [HttpGet("admin/list")]
    public async Task<IActionResult> ListUsersAdmin(
        [FromQuery] int page = 1,
        [FromQuery] int perPage = 20,
        [FromQuery] string search = "",
        [FromQuery] Role? role = null)
    {
        var result = await _userService.ListUsersAdminAsync(page, perPage, search, role);
        return Ok(result);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPatch("admin/{userId}/role")]
    public async Task<IActionResult> UpdateUserRole(string userId, [FromBody] UpdateRoleDto dto)
    {
        var adminUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var updated = await _userService.UpdateUserRoleAsync(adminUserId, userId, dto.Role);
        return Ok(updated);
    }
}

[ApiController]
[Route("api/search")]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string q = "", [FromQuery] int limit = 24, [FromQuery] int offset = 0)
    {
        var result = await _searchService.SearchComicsAsync(q, limit, offset);
        return Ok(result);
    }

    [HttpGet("suggest")]
    public async Task<IActionResult> Suggest([FromQuery] string q = "", [FromQuery] int limit = 5)
    {
        var result = await _searchService.QuickSuggestAsync(q, limit);
        return Ok(result);
    }
}
