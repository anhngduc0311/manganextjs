using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TruyenKomi.Application.Common;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Domain.Entities;
using TruyenKomi.Domain.Enums;

namespace TruyenKomi.Application.Services;

public class AuthService : IAuthService
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwt;

    public AuthService(IAppDbContext db, IJwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existingEmail = await _db.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (existingEmail)
        {
            throw new InvalidOperationException("Email đã được sử dụng.");
        }

        var existingUsername = await _db.Users.AnyAsync(u => u.Username.ToLower() == request.Username.ToLower());
        if (existingUsername)
        {
            throw new InvalidOperationException("Tên đăng nhập đã tồn tại.");
        }

        var user = new User
        {
            Username = request.Username.Trim(),
            Email = request.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 11),
            Role = Role.USER,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var refreshToken = _jwt.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshExpiry = DateTime.UtcNow.AddDays(30);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var accessToken = _jwt.GenerateAccessToken(user);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = MapUserDto(user)
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var identifier = request.Identifier.Trim().ToLower();
        var user = await _db.Users.FirstOrDefaultAsync(u => 
            u.Email.ToLower() == identifier || u.Username.ToLower() == identifier);

        bool isValid = false;
        if (user != null)
        {
            try
            {
                isValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            }
            catch
            {
                isValid = false;
            }
        }

        if (user == null || !isValid)
        {
            throw new UnauthorizedAccessException("Tài khoản hoặc mật khẩu không chính xác.");
        }

        // Gamification: Daily Streak & Login EXP
        var now = DateTime.UtcNow;
        if (user.LastActiveAt.Date != now.Date)
        {
            if (user.LastActiveAt.Date == now.Date.AddDays(-1))
            {
                user.DailyStreak += 1;
            }
            else
            {
                user.DailyStreak = 1;
            }
            user.Exp += GamificationUtils.ExpDailyLogin;
            user.Level = GamificationUtils.ComputeLevel(user.Exp);
        }
        user.LastActiveAt = now;

        var refreshToken = _jwt.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshExpiry = DateTime.UtcNow.AddDays(30);
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var accessToken = _jwt.GenerateAccessToken(user);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = MapUserDto(user)
        };
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new UnauthorizedAccessException("Refresh token không hợp lệ.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
        if (user == null || user.RefreshExpiry < DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Refresh token đã hết hạn hoặc không tồn tại.");
        }

        var newRefreshToken = _jwt.GenerateRefreshToken();
        user.RefreshToken = newRefreshToken;
        user.RefreshExpiry = DateTime.UtcNow.AddDays(30);
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var accessToken = _jwt.GenerateAccessToken(user);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            User = MapUserDto(user)
        };
    }

    public async Task<UserDto?> GetMeAsync(string userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        return user != null ? MapUserDto(user) : null;
    }

    public async Task<bool> LogoutAsync(string userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshExpiry = null;
            await _db.SaveChangesAsync();
        }
        return true;
    }

    private static UserDto MapUserDto(User user) => new()
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
