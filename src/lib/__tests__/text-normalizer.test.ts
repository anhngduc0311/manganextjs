import { describe, expect, it } from "vitest";
import { toSlug, toUnaccent } from "@/lib/text-normalizer";

describe("text-normalizer", () => {
  it("bo dau tieng Viet co dau thuong", () => {
    expect(toUnaccent("Đảo Hải Tạc")).toBe("dao hai tac");
  });

  it("bo dau chu hoa", () => {
    expect(toUnaccent("TRUYỆN TRANH ONLINE")).toBe("truyen tranh online");
  });

  it("giu nguyen chu khong dau", () => {
    expect(toUnaccent("One Piece")).toBe("one piece");
  });

  it("xu ly chu rong", () => {
    expect(toUnaccent("")).toBe("");
  });

  it("xu ly khoang trang thua", () => {
    expect(toUnaccent("  kimetsu   no yaiba  ")).toBe("kimetsu no yaiba");
  });

  it("slug co dau thanh khong dau", () => {
    expect(toSlug("Đảo Hải Tạc")).toBe("dao-hai-tac");
  });

  it("slug loai ky tu dac biet", () => {
    expect(toSlug("Solo Leveling #3!!!")).toBe("solo-leveling-3");
  });

  it("slug nhieu dau gach lien tiep", () => {
    expect(toSlug("a -- b")).toBe("a-b");
  });

  it("slug tieng Nhat romanji", () => {
    expect(toSlug("Shingeki no Kyojin")).toBe("shingeki-no-kyojin");
  });

  it("slug so thap phan giu nguyen", () => {
    expect(toSlug("Chương 99.5: Kết")).toBe("chuong-99-5-ket");
  });
});
