"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, Loader2, X, BookOpen, Eye } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import type { ComicCardDTO } from "@/types";

export function SearchAutocomplete() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ComicCardDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`)
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setResults(data.results || []);
          setLoading(false);
          setIsOpen(true);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 text-zinc-400 pointer-events-none">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> : <Search className="h-4 w-4" />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Tìm truyện tranh, tác giả..."
          className="w-full rounded-full border border-zinc-700/80 bg-zinc-900/90 py-2 pl-9 pr-8 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-2.5 p-0.5 rounded-full text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* Suggest Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-xl">
          {loading && results.length === 0 && (
            <div className="flex items-center justify-center py-6 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-orange-500" /> Đang tìm truyện...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="py-4 text-center text-sm text-zinc-400">
              Không tìm thấy kết quả phù hợp cho &quot;<span className="text-zinc-200">{query}</span>&quot;
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-semibold tracking-wider uppercase text-zinc-500">
                Gợi ý nhanh
              </div>
              {results.map((comic) => (
                <Link
                  key={comic.id}
                  href={`/comics/${comic.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-zinc-800/80"
                >
                  <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                    <Image
                      src={comic.coverImage || "/icons/icon-192.png"}
                      alt={comic.title}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-zinc-100">{comic.title}</h4>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-orange-400" /> {comic.chapterCount} chương
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-zinc-500" /> {comic.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              <button
                type="button"
                onClick={handleSubmit}
                className="mt-1 flex w-full items-center justify-center rounded-lg border border-zinc-800 bg-zinc-800/50 py-2 text-xs font-semibold text-orange-400 hover:bg-orange-500 hover:text-white transition"
              >
                Xem tất cả kết quả cho &quot;{query}&quot;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
