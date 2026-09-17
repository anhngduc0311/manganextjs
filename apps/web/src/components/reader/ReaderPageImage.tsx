"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { RefreshCw, AlertCircle, Image as ImageIcon } from "lucide-react";
import { getCachedImageUrl, cacheImageBlob } from "@/lib/reader-cache";
import { useReaderStore } from "@/stores/reader-store";

export interface ReaderPageImageProps {
  src: string;
  alt: string;
  pageIndex: number;
  priority?: boolean;
  fill?: boolean;
  className?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

export function ReaderPageImage({
  src,
  alt,
  pageIndex,
  priority = false,
  fill = false,
  className = "",
  sizes,
  width = 1000,
  height = 1400,
}: ReaderPageImageProps) {
  const { imageQuality } = useReaderStore();
  const [step, setStep] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(src);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if image is already cached in CacheStorage / Memory
  useEffect(() => {
    let isMounted = true;
    setIsLoaded(false);
    setStep(0);
    setIsRetrying(false);

    getCachedImageUrl(src).then((cached) => {
      if (isMounted && cached) {
        setCurrentUrl(cached);
      } else if (isMounted) {
        // If imageQuality is "saver", route through proxy with quality=saver for instant small payload
        if (imageQuality === "saver") {
          setCurrentUrl(`/api/proxy/image?url=${encodeURIComponent(src)}&quality=saver`);
        } else {
          setCurrentUrl(src);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [src, imageQuality]);

  const handleError = () => {
    if (step === 0) {
      if (src.includes(".mangadex.network/data/") || src.includes(".mangadex.network/data-saver/")) {
        const canonical = src.replace(
          /^https?:\/\/[^/]+\.mangadex\.network\/(data(?:-saver)?\/)/i,
          "https://uploads.mangadex.org/$1"
        );
        setStep(1);
        setCurrentUrl(canonical);
      } else {
        setStep(2);
        setCurrentUrl(`/api/proxy/image?url=${encodeURIComponent(src)}&quality=${imageQuality}`);
      }
    } else if (step === 1) {
      setStep(2);
      setCurrentUrl(`/api/proxy/image?url=${encodeURIComponent(src)}&quality=${imageQuality}`);
    } else {
      setStep(3);
    }
  };

  const handleManualRetry = () => {
    setIsRetrying(true);
    setStep(2);
    setCurrentUrl(`/api/proxy/image?url=${encodeURIComponent(src)}&quality=${imageQuality}&t=${Date.now()}`);
    setTimeout(() => setIsRetrying(false), 800);
  };

  const handleLoadSuccess = () => {
    setIsLoaded(true);
    // Cache image in CacheStorage / Blob memory if not already a blob
    if (!currentUrl.startsWith("blob:") && typeof window !== "undefined") {
      fetch(currentUrl, { mode: "cors" })
        .then((res) => {
          if (res.ok) cacheImageBlob(src, res);
        })
        .catch(() => {});
    }
  };

  if (step === 3) {
    return (
      <div className="flex min-h-[360px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-red-500/20 bg-zinc-950/90 p-6 text-center text-zinc-400">
        <AlertCircle className="h-8 w-8 text-amber-500/80" />
        <p className="text-xs text-zinc-300">
          Không thể tải trang <strong className="text-white">#{pageIndex + 1}</strong> do mạng gián đoạn.
        </p>
        <button
          onClick={handleManualRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-500 transition active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
          <span>{isRetrying ? "Đang tải lại..." : "Tải lại trang"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-zinc-950">
      {/* Zero-CLS Skeleton Shimmer Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-zinc-900/80 animate-pulse min-h-[400px]">
          <div className="flex items-center gap-2 text-zinc-600 text-xs">
            <ImageIcon className="h-5 w-5 animate-bounce" />
            <span>Đang tải trang #{pageIndex + 1}...</span>
          </div>
        </div>
      )}

      {fill ? (
        <Image
          src={currentUrl}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes || "(max-width: 768px) 100vw, 800px"}
          className={`${className} transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          onError={handleError}
          onLoad={handleLoadSuccess}
          unoptimized
          decoding="async"
          referrerPolicy="no-referrer"
        />
      ) : (
        <Image
          src={currentUrl}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes || "(max-width: 768px) 100vw, 1100px"}
          className={`${className} transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          onError={handleError}
          onLoad={handleLoadSuccess}
          loading={priority ? undefined : "lazy"}
          unoptimized
          decoding="async"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}

export default ReaderPageImage;
