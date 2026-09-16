import { describe, it, expect } from "vitest";
import { formatTimeAgoVi } from "../format-time";

describe("formatTimeAgoVi", () => {
  it("formats minutes correctly", () => {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    expect(formatTimeAgoVi(tenMinutesAgo)).toBe("10 phút trước");
  });

  it("formats hours correctly", () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000);
    expect(formatTimeAgoVi(threeHoursAgo)).toBe("3 giờ trước");
  });

  it("formats days correctly", () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 3600 * 1000);
    expect(formatTimeAgoVi(twoDaysAgo)).toBe("2 ngày trước");
  });

  it("handles null / invalid date gracefully", () => {
    expect(formatTimeAgoVi(null)).toBe("");
    expect(formatTimeAgoVi(undefined)).toBe("");
  });
});
