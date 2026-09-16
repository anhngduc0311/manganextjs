/**
 * MangaDex API Service
 * Integration with official MangaDex REST API v5
 * https://api.mangadex.org
 */

export interface MangaDexRelationship {
  id: string;
  type: string;
  related?: string;
  attributes?: {
    name?: string;
    fileName?: string;
    [key: string]: unknown;
  };
}

export interface MangaDexMangaItem {
  id: string;
  type: string;
  attributes: {
    title: Record<string, string>;
    altTitles: Array<Record<string, string>>;
    description: Record<string, string>;
    status: "ongoing" | "completed" | "hiatus" | "cancelled";
    year?: number;
    contentRating?: "safe" | "suggestive" | "erotica" | "pornographic";
    publicationDemographic?: "shounen" | "shoujo" | "seinen" | "josei" | null;
    originalLanguage?: string;
    tags: Array<{
      id: string;
      type: string;
      attributes: {
        name: Record<string, string>;
        group: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
    latestUploadedChapter?: string;
  };
  relationships: MangaDexRelationship[];
}

export interface MangaDexChapterItem {
  id: string;
  type: string;
  attributes: {
    volume: string | null;
    chapter: string | null;
    title: string | null;
    translatedLanguage: string;
    externalUrl: string | null;
    publishAt: string;
    readableAt: string;
    createdAt: string;
    updatedAt: string;
    pages: number;
    version: number;
  };
  relationships: MangaDexRelationship[];
}

export interface MangaDexAtHomeResponse {
  result: string;
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

export interface NormalizedManga {
  id: string;
  title: string;
  otherNames: string;
  description: string;
  author: string;
  status: "ONGOING" | "COMPLETED" | "DROPPED";
  coverUrl: string;
  categories: string[];
  updatedAt: string;
  createdAt: string;
}

export interface NormalizedChapter {
  id: string;
  chapterNumber: number;
  title: string;
  publishedAt: string;
  pageCount: number;
}

export const MANGADEX_GENRE_MAP: Record<string, string> = {
  // Genres
  Action: "Hành Động",
  Adventure: "Phiêu Lưu",
  Comedy: "Hài Hước",
  Drama: "Kịch Tính",
  Fantasy: "Giả Tưởng",
  Horror: "Kinh Dị",
  Mystery: "Bí Ẩn",
  Psychological: "Tâm Lý",
  Romance: "Lãng Mạn",
  "Sci-Fi": "Khoa Học Viễn Tưởng",
  "Slice of Life": "Đời Thường",
  Sports: "Thể Thao",
  Supernatural: "Siêu Nhiên",
  Thriller: "Giật Gân",
  Tragedy: "Bi Kịch",

  // Themes
  Aliens: "Người Ngoài Hành Tinh",
  Animals: "Động Vật",
  Cooking: "Ẩm Thực",
  Crime: "Tội Phạm",
  Crossdressing: "Giả Trang",
  Delinquents: "Bất Lương",
  Demons: "Ác Quỷ",
  Ecchi: "Ecchi",
  Genderswap: "Hoán Đổi Giới Tính",
  Ghosts: "Linh Hồn",
  Gore: "Máu Mê",
  Harem: "Harem",
  Historical: "Lịch Sử",
  Isekai: "Chuyển Sinh",
  Loli: "Loli",
  Magic: "Ma Thuật",
  "Martial Arts": "Võ Thuật",
  Mecha: "Mecha",
  Medical: "Y Học",
  Military: "Quân Sự",
  "Monster Girls": "Nữ Quái Vật",
  Monsters: "Quái Vật",
  Music: "Âm Nhạc",
  Ninja: "Ninja",
  "Office Workers": "Công Sở",
  Police: "Cảnh Sát",
  "Post-Apocalyptic": "Tận Thế",
  Reincarnation: "Trọng Sinh",
  "Reverse Harem": "Harem Ngược",
  Samurai: "Samurai",
  "School Life": "Học Đường",
  Shota: "Shota",
  Superhero: "Siêu Anh Hùng",
  Survival: "Sinh Tồn",
  "Time Travel": "Du Hành Thời Gian",
  Traditional: "Truyền Thống",
  Vampires: "Ma Cà Rồng",
  "Video Games": "Trò Chơi Ảo",
  "Virtual Reality": "Thực Tế Ảo",
  Zombies: "Zombie",

  // Demographics
  Shounen: "Shounen",
  Shoujo: "Shoujo",
  Seinen: "Seinen",
  Josei: "Josei",

  // Formats & Countries
  Adaptation: "Chuyển Thể",
  Anthology: "Tuyển Tập",
  "Award Winning": "Đoạt Giải",
  Doujinshi: "Doujinshi",
  "Fan Colored": "Fan Tô Màu",
  "Full Color": "Bản Màu",
  "Long Strip": "Webtoon",
  "Official Colored": "Bản Màu Chính Thức",
  Oneshot: "Oneshot",
  "Self-Published": "Tự Xuất Bản",
  "Web Comic": "Webtoon",
  "4-Koma": "4-Koma",
  Manhwa: "Manhwa",
  Manhua: "Manhua",
  Manga: "Manga",
  Comic: "Truyện Tranh Mỹ",
  "Việt Nam": "Việt Nam",
};

export function translateMangaDexGenre(rawTag: string): string {
  if (!rawTag) return "";
  const trimmed = rawTag.trim();
  if (MANGADEX_GENRE_MAP[trimmed]) return MANGADEX_GENRE_MAP[trimmed];

  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(MANGADEX_GENRE_MAP)) {
    if (key.toLowerCase() === lower) return val;
  }
  return trimmed;
}

const BASE_API = "https://api.mangadex.org";
const COVERS_BASE = "https://uploads.mangadex.org/covers";

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch wrapper with rate limiting & exponential backoff for 429
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 4, delayBetweenReq = 350): Promise<Response> {
  let attempt = 0;
  await sleep(delayBetweenReq);

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": "TruyenKomi-App/1.0 (https://truyenkomi.local)",
          Accept: "application/json",
          ...(options.headers || {}),
        },
      });

      if (response.status === 429) {
        attempt++;
        const retryAfterHeader = response.headers.get("retry-after") || response.headers.get("x-ratelimit-retry-after");
        const waitTime = retryAfterHeader ? Math.max(1, parseInt(retryAfterHeader, 10)) * 1000 : Math.pow(2, attempt) * 2000;
        console.warn(`[MangaDex RateLimit] 429 Too Many Requests on ${url}. Retrying in ${waitTime}ms (Attempt ${attempt}/${maxRetries})...`);
        await sleep(waitTime);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 200)}`);
      }

      return response;
    } catch (err: unknown) {
      attempt++;
      if (attempt >= maxRetries) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[MangaDex API] Request failed (${msg}). Retrying in ${attempt * 1500}ms...`);
      await sleep(attempt * 1500);
    }
  }

  throw new Error(`Failed to fetch ${url} after ${maxRetries} retries.`);
}

export const mangadexService = {
  /**
   * Fetch Vietnamese manga list with pagination
   * @param offset Start offset (0, 100, 200...)
   * @param limit Number of manga per page (max 100)
   * @param order Sort order: 'latest' (latestUploadedChapter desc) or 'created' (createdAt desc)
   */
  async getVietnameseMangaList(params: {
    offset?: number;
    limit?: number;
    order?: "latest" | "created" | "updated";
    contentRatings?: Array<"safe" | "suggestive" | "erotica">;
  } = {}): Promise<{
    data: MangaDexMangaItem[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { offset = 0, limit = 100, order = "latest", contentRatings = ["safe", "suggestive", "erotica"] } = params;

    const query = new URLSearchParams();
    query.set("limit", String(Math.min(100, limit)));
    query.set("offset", String(offset));
    query.append("availableTranslatedLanguage[]", "vi");

    for (const cr of contentRatings) {
      query.append("contentRating[]", cr);
    }

    query.append("includes[]", "cover_art");
    query.append("includes[]", "author");
    query.append("includes[]", "artist");
    query.append("includes[]", "tag");

    if (order === "latest") {
      query.set("order[latestUploadedChapter]", "desc");
    } else if (order === "created") {
      query.set("order[createdAt]", "desc");
    } else {
      query.set("order[updatedAt]", "desc");
    }

    const url = `${BASE_API}/manga?${query.toString()}`;
    const res = await fetchWithRetry(url);
    const json = await res.json();

    return {
      data: json.data || [],
      total: json.total || 0,
      limit: json.limit || limit,
      offset: json.offset || offset,
    };
  },

  /**
   * Normalize raw MangaDex manga object into a clean standard structure
   */
  normalizeManga(manga: MangaDexMangaItem): NormalizedManga {
    const attr = manga.attributes;

    // Pick best title (vi -> en -> first available)
    const title = attr.title.vi || attr.title.en || Object.values(attr.title)[0] || "Không tên";

    // Collect alternative titles
    const otherNamesArr: string[] = [];
    if (attr.altTitles) {
      for (const alt of attr.altTitles) {
        const val = Object.values(alt)[0];
        if (val && val !== title && !otherNamesArr.includes(val)) {
          otherNamesArr.push(val);
        }
      }
    }
    const otherNames = otherNamesArr.slice(0, 5).join(", ");

    // Pick description (vi -> en -> first available)
    const description = attr.description?.vi || attr.description?.en || (attr.description ? Object.values(attr.description)[0] : "") || "";

    // Find Author & Artist from relationships
    const authors: string[] = [];
    let coverFileName = "";

    for (const rel of manga.relationships) {
      if ((rel.type === "author" || rel.type === "artist") && rel.attributes?.name) {
        const authorName = rel.attributes.name.trim();
        if (authorName && !authors.includes(authorName)) {
          authors.push(authorName);
        }
      }
      if (rel.type === "cover_art" && rel.attributes?.fileName) {
        coverFileName = rel.attributes.fileName.trim();
      }
    }

    const author = authors.join(", ") || "Đang cập nhật";

    // Build cover image URL
    const coverUrl = coverFileName
      ? `${COVERS_BASE}/${manga.id}/${coverFileName}`
      : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80";

    // Status map
    let status: "ONGOING" | "COMPLETED" | "DROPPED" = "ONGOING";
    if (attr.status === "completed") status = "COMPLETED";
    else if (attr.status === "cancelled" || attr.status === "hiatus") status = "DROPPED";

    // Extract tags / genres dynamically
    const categories: string[] = [];
    const seen = new Set<string>();

    const addCategory = (name?: string | null) => {
      if (!name) return;
      const clean = name.trim();
      if (clean && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        categories.push(clean);
      }
    };

    // 1. Tags from MangaDex
    if (attr.tags) {
      for (const tag of attr.tags) {
        const tagName = tag.attributes?.name?.vi || tag.attributes?.name?.en || Object.values(tag.attributes?.name || {})[0];
        if (typeof tagName === "string" && tagName.trim()) {
          addCategory(tagName.trim());
        }
      }
    }

    // 2. Publication Demographic
    if (attr.publicationDemographic) {
      const demo = attr.publicationDemographic.toLowerCase();
      if (demo === "shounen") addCategory("Shounen");
      else if (demo === "shoujo") addCategory("Shoujo");
      else if (demo === "seinen") addCategory("Seinen");
      else if (demo === "josei") addCategory("Josei");
    }

    // 3. Country / Format from originalLanguage
    if (attr.originalLanguage) {
      const lang = attr.originalLanguage.toLowerCase();
      if (lang === "ko") addCategory("Manhwa");
      else if (lang === "zh" || lang === "zh-hk") addCategory("Manhua");
      else if (lang === "ja") addCategory("Manga");
      else if (lang === "vi") addCategory("Việt Nam");
      else if (lang === "en") addCategory("Comic");
    }

    return {
      id: manga.id,
      title,
      otherNames,
      description,
      author,
      status,
      coverUrl,
      categories,
      updatedAt: attr.updatedAt,
      createdAt: attr.createdAt,
    };
  },

  /**
   * Fetch all Vietnamese chapters for a specific Manga
   */
  async getVietnameseChapters(mangaId: string): Promise<NormalizedChapter[]> {
    let allChapters: MangaDexChapterItem[] = [];
    let offset = 0;
    const limit = 500;
    let total = 1;

    while (offset < total) {
      const query = new URLSearchParams();
      query.set("limit", String(limit));
      query.set("offset", String(offset));
      query.append("translatedLanguage[]", "vi");
      query.set("order[chapter]", "asc");
      query.append("includes[]", "scanlation_group");

      const url = `${BASE_API}/manga/${mangaId}/feed?${query.toString()}`;
      const res = await fetchWithRetry(url);
      const json = await res.json();

      const items: MangaDexChapterItem[] = json.data || [];
      allChapters = allChapters.concat(items);
      total = json.total || 0;
      offset += limit;

      if (items.length === 0) break;
    }

    // Deduplicate and parse chapters
    // If there are multiple releases for the same chapter number, keep the latest one
    const chapterMap = new Map<number, NormalizedChapter>();

    for (const c of allChapters) {
      // Exclude external links if any
      if (c.attributes.externalUrl) continue;

      const rawChapter = c.attributes.chapter;
      let chapterNum = 0;

      if (rawChapter !== null && rawChapter !== undefined && rawChapter !== "") {
        chapterNum = parseFloat(rawChapter);
        if (isNaN(chapterNum)) chapterNum = 0;
      }

      const title = c.attributes.title || (chapterNum > 0 ? `Chương ${chapterNum}` : "Oneshot / Mở đầu");

      // Replace or insert
      chapterMap.set(chapterNum, {
        id: c.id,
        chapterNumber: chapterNum,
        title,
        publishedAt: c.attributes.publishAt || c.attributes.createdAt,
        pageCount: c.attributes.pages || 0,
      });
    }

    // Sort chapters ascending
    return Array.from(chapterMap.values()).sort((a, b) => a.chapterNumber - b.chapterNumber);
  },

  /**
   * Fetch page image URLs for a chapter using MangaDex @Home Network
   * @param chapterId MangaDex chapter UUID
   * @param quality 'original' for full resolution, 'dataSaver' for compressed webp
   */
  async getChapterPages(
    chapterId: string,
    quality: "original" | "dataSaver" = "original"
  ): Promise<{
    chapterId: string;
    pages: Array<{ pageIndex: number; imageUrl: string }>;
  }> {
    const url = `${BASE_API}/at-home/server/${chapterId}?forcePort443=true`;
    const res = await fetchWithRetry(url, {}, 5, 500);
    const json: MangaDexAtHomeResponse = await res.json();

    if (json.result !== "ok" || !json.baseUrl || !json.chapter) {
      throw new Error(`Invalid @home response for chapter ${chapterId}`);
    }

    const { baseUrl, chapter } = json;
    const hash = chapter.hash;
    const fileList = quality === "dataSaver" && chapter.dataSaver?.length ? chapter.dataSaver : chapter.data;
    const subFolder = quality === "dataSaver" && chapter.dataSaver?.length ? "data-saver" : "data";

    const pages = fileList.map((fileName, index) => ({
      pageIndex: index,
      imageUrl: `${baseUrl}/${subFolder}/${hash}/${fileName}`,
    }));

    return {
      chapterId,
      pages,
    };
  },
};
