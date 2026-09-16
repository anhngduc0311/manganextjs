"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { RefreshCw, AlertCircle } from "lucide-react";

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
  // Step 0: Original src
  // Step 1: Canonical uploads.mangadex.org (if mangadex.network)
  // Step 2: Local Server Proxy (/api/proxy/image?url=...)
  // Step 3: Error / Retry state
  const [step, setStep] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(src);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    setCurrentUrl(src);
    setStep(0);
    setIsRetrying(false);
  }, [src]);

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
        setCurrentUrl(`/api/proxy/image?url=${encodeURIComponent(src)}`);
      }
    } else if (step === 1) {
      setStep(2);
      setCurrentUrl(`/api/proxy/image?url=${encodeURIComponent(src)}`);
    } else {
      setStep(3);
    }
  };

  const handleManualRetry = () => {
    setIsRetrying(true);
    setStep(2);
    // Add cache-busting timestamp to retry fresh
    setCurrentUrl(`/api/proxy/image?url=${encodeURIComponent(src)}&t=${Date.now()}`);
    setTimeout(() => setIsRetrying(false), 800);
  };

  if (step === 3) {
    return (
      <div className="flex min-h-[350px] w-full flex-col items-center justify-center gap-3 rounded-lg border border-red-500/20 bg-zinc-950/80 p-6 text-center text-zinc-400">
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

  if (fill) {
    return (
      <Image
        src={currentUrl}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes || "(max-width: 768px) 100vw, 800px"}
        className={className}
        onError={handleError}
        unoptimized
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <Image
      src={currentUrl}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes={sizes || "(max-width: 768px) 100vw, 1100px"}
      className={className}
      onError={handleError}
      loading={priority ? undefined : "lazy"}
      unoptimized
      referrerPolicy="no-referrer"
    />
  );
}

export default ReaderPageImage;
