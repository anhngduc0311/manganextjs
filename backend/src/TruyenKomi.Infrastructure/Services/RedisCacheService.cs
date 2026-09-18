using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using TruyenKomi.Application.Interfaces;

namespace TruyenKomi.Infrastructure.Services;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly IDatabase? _db;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IConfiguration config, ILogger<RedisCacheService> logger)
    {
        _logger = logger;
        var connectionString = config["Redis:ConnectionString"] 
                               ?? config["UPSTASH_REDIS_URL_TCP"] 
                               ?? config["REDIS_URL"];

        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            try
            {
                var options = ConfigurationOptions.Parse(connectionString);
                options.AbortOnConnectFail = false;
                options.ConnectTimeout = 5000;
                _redis = ConnectionMultiplexer.Connect(options);
                _db = _redis.GetDatabase();
                _logger.LogInformation("Redis connected successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not connect to Redis. Fallback to no-op cache.");
            }
        }
        else
        {
            _logger.LogInformation("No Redis connection string configured. Using in-memory fallback.");
        }
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        if (_db == null) return default;
        try
        {
            var value = await _db.StringGetAsync(key);
            if (value.IsNullOrEmpty) return default;
            return JsonSerializer.Deserialize<T>(value.ToString()!);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis GetAsync failed for key: {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        if (_db == null) return;
        try
        {
            var json = JsonSerializer.Serialize(value);
            if (expiry.HasValue)
            {
                await _db.StringSetAsync(key, json, expiry.Value);
            }
            else
            {
                await _db.StringSetAsync(key, json);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis SetAsync failed for key: {Key}", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        if (_db == null) return;
        try
        {
            await _db.KeyDeleteAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis RemoveAsync failed for key: {Key}", key);
        }
    }

    public async Task InvalidatePatternAsync(string pattern)
    {
        if (_redis == null || _db == null) return;
        try
        {
            var endpoints = _redis.GetEndPoints();
            foreach (var endpoint in endpoints)
            {
                var server = _redis.GetServer(endpoint);
                foreach (var key in server.Keys(pattern: pattern))
                {
                    await _db.KeyDeleteAsync(key);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis InvalidatePatternAsync failed for pattern: {Pattern}", pattern);
        }
    }

    public async Task<long> IncrementAsync(string key, long value = 1)
    {
        if (_db == null) return value;
        try
        {
            return await _db.StringIncrementAsync(key, value);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis IncrementAsync failed for key: {Key}", key);
            return value;
        }
    }

    public IDatabase? GetDatabase() => _db;
    public IConnectionMultiplexer? GetConnection() => _redis;
}
