using System;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace TruyenKomi.Application.Common;

public static class TextNormalizer
{
    public static string ToUnaccent(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        var result = stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        // Replace special Vietnamese characters like Đ, đ
        result = result.Replace("đ", "d").Replace("Đ", "D");
        return result.ToLowerInvariant().Trim();
    }

    public static string ToSlug(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var unaccented = ToUnaccent(text);
        // Remove invalid characters
        var slug = Regex.Replace(unaccented, @"[^a-z0-9\s-]", "");
        // Convert multiple spaces to a single hyphen
        slug = Regex.Replace(slug, @"\s+", "-").Trim('-');
        return slug;
    }
}

public static class GamificationUtils
{
    public static int ComputeLevel(int exp)
    {
        if (exp <= 0) return 1;
        return (int)Math.Floor(Math.Sqrt(exp / 100.0)) + 1;
    }

    public const int ExpPerChapter = 5;
    public const int ExpPerComment = 10;
    public const int ExpPerRating = 10;
    public const int ExpDailyLogin = 20;
}
