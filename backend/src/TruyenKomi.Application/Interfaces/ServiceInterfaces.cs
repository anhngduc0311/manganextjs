using System.Collections.Generic;
using System.Threading.Tasks;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Domain.Entities;
using TruyenKomi.Domain.Enums;

namespace TruyenKomi.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);
    Task<UserDto?> GetMeAsync(string userId);
    Task<bool> LogoutAsync(string userId);
}

public interface IComicService
{
    Task<HomeFeedDto> GetHomeFeedAsync();
    Task<List<ComicCardDto>> GetRankingsAsync(string period);
    Task<List<GenreDto>> ListCategoriesAsync();
    Task<PagedResult<ComicCardDto>> ListComicsAsync(List<string>? genres, ComicStatus? status, string? sort, int page, int perPage);
    Task<ComicDetailDto?> GetBySlugAsync(string slug);
    Task<ComicDetailDto> CreateComicAsync(CreateComicDto dto);
    Task<ComicDetailDto> UpdateComicAsync(string id, UpdateComicDto dto);
    Task<bool> DeleteComicAsync(string id);
    Task<GenreDto> CreateCategoryAsync(CreateGenreDto dto);
    Task<GenreDto> UpdateCategoryAsync(string id, UpdateGenreDto dto);
    Task<bool> DeleteCategoryAsync(string id);
}

public interface IChapterService
{
    Task<ReaderDataDto?> GetReaderDataAsync(string comicSlug, double chapterNumber);
    Task<List<ChapterBriefDto>> ListChaptersByComicIdAsync(string comicId);
    Task<List<ChapterDetailDto>> ListChaptersAdminAsync(string comicId);
    Task<ChapterDetailDto> UpsertChapterAsync(UpsertChapterDto dto);
    Task<bool> DeleteChapterAsync(string id);
}

public interface ICommentService
{
    Task<PagedResult<CommentDto>> ListAsync(string comicId, string? chapterId, int page, int perPage);
    Task<CommentDto> CreateAsync(string userId, CreateCommentDto dto);
    Task<int> LikeAsync(string commentId);
    Task<bool> RemoveAsync(string commentId);
    Task<PagedResult<CommentDto>> ListForModerationAsync(int page, int perPage, string search);
}

public interface IRatingService
{
    Task<double> RateComicAsync(string userId, RateComicDto dto);
    Task<int?> GetUserRatingAsync(string userId, string comicId);
}

public interface IUserService
{
    Task<UserDto> GetProfileAsync(string userId);
    Task<UserDto> UpdateProfileAsync(string userId, UpdateProfileDto dto);
    Task<PagedResult<FollowItemDto>> GetFollowsAsync(string userId, int page, int perPage);
    Task<bool> ToggleFollowAsync(string userId, string comicId);
    Task<bool> IsFollowingAsync(string userId, string comicId);
    Task<PagedResult<HistoryItemDto>> GetHistoryAsync(string userId, int page, int perPage);
    Task<bool> RecordHistoryAsync(string userId, RecordHistoryDto dto);
    Task<PagedResult<UserDto>> ListUsersAdminAsync(int page, int perPage, string search, Role? role);
    Task<UserDto> UpdateUserRoleAsync(string adminUserId, string targetUserId, Role role);
}

public interface ISearchService
{
    Task<PagedResult<ComicCardDto>> SearchComicsAsync(string query, int limit, int offset);
    Task<List<ComicCardDto>> QuickSuggestAsync(string query, int limit);
}

public interface INotificationService
{
    Task<List<NotificationDto>> ListRecentAsync(string userId, int limit);
    Task<int> CountUnreadAsync(string userId);
    Task<bool> MarkReadAsync(string userId, string notificationId);
    Task<bool> MarkAllReadAsync(string userId);
    Task CreateNotificationAsync(string userId, string title, string message, string? linkUrl);
}

public interface IReportService
{
    Task<ReportDto> CreateReportAsync(string? userId, CreateReportDto dto);
    Task<PagedResult<ReportDto>> ListReportsAsync(int page, int perPage, string? status);
    Task<ReportDto> ResolveReportAsync(string id, ResolveReportDto dto);
}

public interface IStorageService
{
    Task<PresignedUrlResponse> GetPresignedPutUrlAsync(string filename, string contentType);
}

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, System.TimeSpan? expiry = null);
    Task RemoveAsync(string key);
    Task InvalidatePatternAsync(string pattern);
    Task<long> IncrementAsync(string key, long value = 1);
}

public interface ICrawlerService
{
    Task<object> IngestAsync(IngestPayloadDto payload);
}

public interface IViewsService
{
    Task RecordViewAsync(RecordViewDto dto);
}
