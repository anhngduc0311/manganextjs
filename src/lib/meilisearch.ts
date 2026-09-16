import { Meilisearch } from "meilisearch";
import { env, hasMeilisearch } from "@/lib/env";
import { logger } from "@/lib/logger";

export interface MeiliComicDocument {
  id: string;
  title: string;
  titleUnaccent: string;
  slug: string;
  otherNames?: string | null;
  author?: string | null;
  status: string;
  coverImage: string;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  chapterCount: number;
  categories: string[];
  updatedAt: string;
  createdAt: string;
}

let client: Meilisearch | null = null;

export function getMeiliClient(): Meilisearch | null {
  if (client) return client;
  if (!hasMeilisearch || !env.MEILISEARCH_HOST) return null;

  try {
    client = new Meilisearch({
      host: env.MEILISEARCH_HOST,
      apiKey: env.MEILISEARCH_MASTER_KEY || undefined,
    });
    return client;
  } catch (err) {
    logger.warn({ err }, "Meilisearch client initialization failed");
    return null;
  }
}

export const meiliService = {
  async initIndex(): Promise<void> {
    const cli = getMeiliClient();
    if (!cli) return;

    try {
      const index = cli.index("comics");
      await index.updateSettings({
        searchableAttributes: [
          "title",
          "titleUnaccent",
          "otherNames",
          "author",
          "categories",
        ],
        filterableAttributes: ["status", "categories", "author"],
        sortableAttributes: ["views", "ratingAvg", "updatedAt", "createdAt"],
        rankingRules: [
          "words",
          "typo",
          "proximity",
          "attribute",
          "sort",
          "exactness",
        ],
      });
      logger.info("✅ Meilisearch 'comics' index settings initialized.");
    } catch (err) {
      logger.warn({ err }, "Meilisearch initIndex failed");
    }
  },

  async indexComics(documents: MeiliComicDocument[]): Promise<void> {
    const cli = getMeiliClient();
    if (!cli || documents.length === 0) return;

    try {
      const sanitized = documents.map((doc) => ({
        ...doc,
        views: Number(doc.views || 0),
        ratingAvg: Number(doc.ratingAvg || 0),
        ratingCount: Number(doc.ratingCount || 0),
        chapterCount: Number(doc.chapterCount || 0),
      }));
      const index = cli.index<MeiliComicDocument>("comics");
      await index.addDocuments(sanitized, { primaryKey: "id" });
    } catch (err) {
      logger.warn({ err, count: documents.length }, "Meilisearch indexComics failed");
    }
  },

  async deleteComic(id: string): Promise<void> {
    const cli = getMeiliClient();
    if (!cli) return;

    try {
      const index = cli.index("comics");
      await index.deleteDocument(id);
    } catch (err) {
      logger.warn({ err, id }, "Meilisearch deleteComic failed");
    }
  },

  async search(query: string, options: { limit?: number; offset?: number; filter?: string; sort?: string[] } = {}) {
    const cli = getMeiliClient();
    if (!cli) return null;

    try {
      const index = cli.index<MeiliComicDocument>("comics");
      const res = await index.search(query, {
        limit: options.limit ?? 24,
        offset: options.offset ?? 0,
        filter: options.filter,
        sort: options.sort,
      });
      return res;
    } catch (err) {
      logger.warn({ err, query }, "Meilisearch search error, falling back to DB");
      return null;
    }
  },

  async health(): Promise<boolean> {
    const cli = getMeiliClient();
    if (!cli) return false;
    try {
      const health = await cli.health();
      return health.status === "available";
    } catch {
      return false;
    }
  },
};
