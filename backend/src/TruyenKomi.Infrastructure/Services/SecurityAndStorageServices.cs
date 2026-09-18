using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using TruyenKomi.Application.DTOs;
using TruyenKomi.Application.Interfaces;
using TruyenKomi.Domain.Entities;

namespace TruyenKomi.Infrastructure.Services;

public class StorageService : IStorageService
{
    private readonly IConfiguration _config;
    private readonly ILogger<StorageService> _logger;
    private readonly IAmazonS3? _s3Client;
    private readonly string _bucketName;
    private readonly string _publicDomain;

    public StorageService(IConfiguration config, ILogger<StorageService> logger)
    {
        _config = config;
        _logger = logger;

        var accountId = config["R2_ACCOUNT_ID"] ?? config["Storage:AccountId"];
        var accessKey = config["R2_ACCESS_KEY_ID"] ?? config["Storage:AccessKey"];
        var secretKey = config["R2_SECRET_ACCESS_KEY"] ?? config["Storage:SecretKey"];
        _bucketName = config["R2_BUCKET_NAME"] ?? config["Storage:BucketName"] ?? "truyenkomi";
        _publicDomain = config["R2_PUBLIC_DOMAIN"] ?? config["Storage:PublicDomain"] ?? "https://cdn.truyenkomi.com";

        if (!string.IsNullOrWhiteSpace(accountId) && !string.IsNullOrWhiteSpace(accessKey) && !string.IsNullOrWhiteSpace(secretKey))
        {
            var s3Config = new AmazonS3Config
            {
                ServiceURL = $"https://{accountId}.r2.cloudflarestorage.com",
                AuthenticationRegion = "auto",
                ForcePathStyle = true
            };
            _s3Client = new AmazonS3Client(accessKey, secretKey, s3Config);
        }
        else
        {
            _logger.LogInformation("Cloudflare R2 / S3 storage credentials not fully set. Presigned URLs will use public domain mockup.");
        }
    }

    public async Task<PresignedUrlResponse> GetPresignedPutUrlAsync(string filename, string contentType)
    {
        var ext = System.IO.Path.GetExtension(filename);
        var key = $"uploads/{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid()}{ext}";

        string uploadUrl;
        if (_s3Client != null)
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = key,
                Verb = HttpVerb.PUT,
                Expires = DateTime.UtcNow.AddMinutes(15),
                ContentType = contentType
            };
            uploadUrl = await Task.Run(() => _s3Client.GetPreSignedURL(request));
        }
        else
        {
            uploadUrl = $"{_publicDomain}/{key}?mockPresigned=true";
        }

        var publicUrl = $"{_publicDomain.TrimEnd('/')}/{key}";

        return new PresignedUrlResponse
        {
            Key = key,
            UploadUrl = uploadUrl,
            PublicUrl = publicUrl
        };
    }
}

public static class PasswordHasher
{
    public static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, 11);
    }

    public static bool VerifyPassword(string password, string passwordHash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch
        {
            return false;
        }
    }
}

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateAccessToken(User user)
    {
        var secret = _config["Jwt:Secret"] ?? _config["AUTH_SECRET"] ?? _config["NEXTAUTH_SECRET"] ?? "super_secret_truyenkomi_key_1234567890123456";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "TruyenKomi",
            audience: _config["Jwt:Audience"] ?? "TruyenKomiClient",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}
