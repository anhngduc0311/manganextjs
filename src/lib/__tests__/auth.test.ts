import { describe, expect, it, vi } from "vitest";
import { loginSchema, registerSchema } from "@/types/schemas";
import { authConfig } from "@/lib/auth-config";
import { authService } from "@/services/auth.service";
import { checkRateLimit } from "@/lib/rate-limiter";

describe("Phase 3 - Auth Schemas & Validation", () => {
  it("validates valid login credentials", () => {
    const valid = loginSchema.safeParse({
      identifier: "testuser@example.com",
      password: "password123",
    });
    expect(valid.success).toBe(true);
  });

  it("fails login with empty identifier or password", () => {
    const invalid = loginSchema.safeParse({
      identifier: "",
      password: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates valid register credentials", () => {
    const valid = registerSchema.safeParse({
      username: "valid_user_99",
      email: "valid@example.com",
      password: "password123",
    });
    expect(valid.success).toBe(true);
  });

  it("fails register with invalid username (special chars)", () => {
    const invalid = registerSchema.safeParse({
      username: "invalid user!@#",
      email: "valid@example.com",
      password: "password123",
    });
    expect(invalid.success).toBe(false);
  });

  it("fails register with short password (< 8 chars)", () => {
    const invalid = registerSchema.safeParse({
      username: "valid_user",
      email: "valid@example.com",
      password: "123",
    });
    expect(invalid.success).toBe(false);
  });
});

describe("Phase 3 - Auth.js Config Callbacks", () => {
  it("JWT callback attaches id, role, and avatar from user", () => {
    const token = {};
    const user = {
      id: "user-123",
      name: "TestUser",
      email: "test@example.com",
      role: "MODERATOR" as const,
      image: "https://avatar.com/pic.jpg",
    };

    const result = (authConfig.callbacks?.jwt as any)?.({ token, user, trigger: "signIn", account: null });
    expect(result).toEqual({
      id: "user-123",
      role: "MODERATOR",
      avatar: "https://avatar.com/pic.jpg",
    });
  });

  it("Session callback attaches user id, role, and avatar from token", () => {
    const session = {
      user: {
        id: "",
        name: "TestUser",
        email: "test@example.com",
        emailVerified: null,
      },
      expires: "2026-12-31T23:59:59.999Z",
    };
    const token = {
      id: "user-456",
      role: "ADMIN" as const,
      avatar: "https://avatar.com/admin.jpg",
    };

    // @ts-expect-error test callback
    const result = authConfig.callbacks?.session?.({ session, token });
    expect(result?.user?.id).toBe("user-456");
    expect(result?.user?.role).toBe("ADMIN");
    expect(result?.user?.avatar).toBe("https://avatar.com/admin.jpg");
  });
});

describe("Phase 3 - Password Hashing & Verification", () => {
  it("hashes password with Argon2 and verifies correctly", async () => {
    const plain = "SuperSecretPassword2026!";
    const hashed = await authService.hashPassword(plain);
    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(plain);

    const match = await authService.verifyPassword(plain, hashed);
    expect(match).toBe(true);

    const wrongMatch = await authService.verifyPassword("wrongPassword", hashed);
    expect(wrongMatch).toBe(false);
  });
});

describe("Phase 3 - Rate Limiter Helper", () => {
  it("returns success if limiter is null (fallback mode)", async () => {
    const res = await checkRateLimit(null, "test-ip");
    expect(res).toEqual({ success: true });
  });

  it("handles mock limiter exceeded correctly", async () => {
    const mockLimiter = {
      limit: vi.fn().mockResolvedValue({
        success: false,
        reset: Date.now() + 15000,
      }),
    };
    // @ts-expect-error mock test
    const res = await checkRateLimit(mockLimiter, "spam-ip");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.retryAfter).toBeGreaterThan(0);
    }
  });
});
