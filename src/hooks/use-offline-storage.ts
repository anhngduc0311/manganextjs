"use client";

import { openDB, type IDBPDatabase } from "idb";
import { useCallback, useEffect, useState } from "react";

const DB_NAME = "truyenkomi-offline-db";
const DB_VERSION = 1;
const STORE_NAME = "offline_chapters";

export interface OfflineChapterData {
  chapterId: string;
  comicSlug: string;
  comicTitle: string;
  chapterNumber: number;
  chapterTitle?: string | null;
  pages: Blob[];
  savedAt: number;
}

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "chapterId" });
      }
    },
  });
}

export function useOfflineStorage() {
  const [downloading, setDownloading] = useState<Record<string, number>>({});
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  const refreshDownloadedList = useCallback(async () => {
    try {
      const db = await getDB();
      const keys = await db.getAllKeys(STORE_NAME);
      setDownloadedIds(new Set(keys.map(String)));
    } catch {
      // Ignored if IDB not supported in environment
    }
  }, []);

  useEffect(() => {
    refreshDownloadedList();
  }, [refreshDownloadedList]);

  const downloadChapter = useCallback(
    async (
      chapterId: string,
      comicSlug: string,
      comicTitle: string,
      chapterNumber: number,
      imageUrls: string[],
      chapterTitle?: string | null
    ) => {
      setDownloading((prev) => ({ ...prev, [chapterId]: 1 }));
      const blobs: Blob[] = [];

      try {
        const total = imageUrls.length;
        for (let i = 0; i < total; i++) {
          const url = imageUrls[i];
          if (!url) continue;

          const res = await fetch(url);
          if (!res.ok) throw new Error(`Không thể tải ảnh: ${url}`);
          const blob = await res.blob();
          blobs.push(blob);

          const percent = Math.round(((i + 1) / total) * 100);
          setDownloading((prev) => ({ ...prev, [chapterId]: percent }));
        }

        const chapterData: OfflineChapterData = {
          chapterId,
          comicSlug,
          comicTitle,
          chapterNumber,
          chapterTitle,
          pages: blobs,
          savedAt: Date.now(),
        };

        const db = await getDB();
        await db.put(STORE_NAME, chapterData);

        setDownloadedIds((prev) => new Set([...prev, chapterId]));
        setDownloading((prev) => {
          const next = { ...prev };
          delete next[chapterId];
          return next;
        });

        return true;
      } catch (err) {
        setDownloading((prev) => {
          const next = { ...prev };
          delete next[chapterId];
          return next;
        });
        throw err;
      }
    },
    []
  );

  const getOfflineChapter = useCallback(async (chapterId: string): Promise<OfflineChapterData | null> => {
    try {
      const db = await getDB();
      const data = await db.get(STORE_NAME, chapterId);
      return data ?? null;
    } catch {
      return null;
    }
  }, []);

  const removeOfflineChapter = useCallback(
    async (chapterId: string) => {
      try {
        const db = await getDB();
        await db.delete(STORE_NAME, chapterId);
        setDownloadedIds((prev) => {
          const next = new Set(prev);
          next.delete(chapterId);
          return next;
        });
      } catch (err) {
        console.error("Lỗi xóa chương offline:", err);
      }
    },
    []
  );

  const listOfflineChapters = useCallback(async (): Promise<OfflineChapterData[]> => {
    try {
      const db = await getDB();
      return await db.getAll(STORE_NAME);
    } catch {
      return [];
    }
  }, []);

  return {
    downloading,
    downloadedIds,
    downloadChapter,
    getOfflineChapter,
    removeOfflineChapter,
    listOfflineChapters,
    refreshDownloadedList,
  };
}
