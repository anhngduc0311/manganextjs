import { beforeEach, describe, expect, it, vi } from "vitest";
import { authServerCallbacks } from "@/lib/auth-server-callbacks";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique } } }));

describe("current account permissions", () => {
  beforeEach(() => vi.resetAllMocks());
  const refresh = () => authServerCallbacks.jwt({
    token: { id: "user-1", role: "ADMIN" },
    user: undefined as unknown as Parameters<typeof authServerCallbacks.jwt>[0]["user"],
    account: null,
  });

  it("replaces a stale ADMIN role with the database role", async () => {
    findUnique.mockResolvedValue({ role: "USER", avatar: null });
    expect(await refresh()).toMatchObject({ id: "user-1", role: "USER" });
  });

  it("picks up a promotion without another login", async () => {
    findUnique.mockResolvedValue({ role: "MODERATOR", avatar: null });
    expect(await refresh()).toMatchObject({ role: "MODERATOR" });
  });

  it("invalidates sessions for deleted accounts", async () => {
    findUnique.mockResolvedValue(null);
    expect(await refresh()).toBeNull();
  });

  it("does not fall back to stale privileges when the database fails", async () => {
    findUnique.mockRejectedValue(new Error("Database unavailable"));
    await expect(refresh()).rejects.toThrow("Database unavailable");
  });
});
