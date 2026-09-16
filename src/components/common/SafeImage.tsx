"use client";

import React, { useState, useEffect } from "react";
import Image, { type ImageProps } from "next/image";

export interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
}

function normalizeImageUrl(source: string | unknown): string {
  if (typeof source !== "string" || !source.trim()) {
    return "";
  }
  const clean = source.trim();
  // Auto-optimize raw MangaDex cover art by appending .512.jpg thumbnail suffix
  if (
    clean.includes("uploads.mangadex.org/covers/") &&
    !clean.endsWith(".512.jpg") &&
    !clean.endsWith(".256.jpg")
  ) {
    return `${clean}.512.jpg`;
  }
  return clean;
}

export function SafeImage({
  src,
  alt,
  fallbackSrc = "/icons/icon-192.png",
  className,
  unoptimized: propUnoptimized,
  ...rest
}: SafeImageProps) {
  const [errorCount, setErrorCount] = useState(0);
  const [forceUnoptimized, setForceUnoptimized] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    const initial = normalizeImageUrl(src);
    return initial || fallbackSrc;
  });

  useEffect(() => {
    const normalized = normalizeImageUrl(src);
    if (normalized) {
      setImgSrc(normalized);
      setErrorCount(0);
      setForceUnoptimized(false);
    } else {
      setImgSrc(fallbackSrc);
    }
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (errorCount === 0) {
      // Step 1: Retry loading directly from CDN without Next.js proxy (bypasses server timeouts)
      setErrorCount(1);
      setForceUnoptimized(true);
    } else if (errorCount === 1 && typeof imgSrc === "string" && imgSrc.endsWith(".512.jpg")) {
      // Step 2: If 512 thumbnail failed, try raw uncompressed cover
      setErrorCount(2);
      setImgSrc(imgSrc.replace(/\.512\.jpg$/, ""));
    } else if (errorCount === 1 && typeof imgSrc === "string" && !imgSrc.endsWith(".512.jpg") && imgSrc.includes("uploads.mangadex.org")) {
      // Step 2b: If raw failed, try 512 thumbnail
      setErrorCount(2);
      setImgSrc(`${imgSrc}.512.jpg`);
    } else {
      // Step 3: Final fallback to default placeholder
      setErrorCount(3);
      setImgSrc(fallbackSrc);
      setForceUnoptimized(true);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt || "TruyenKomi Image"}
      className={className}
      onError={handleError}
      unoptimized={propUnoptimized ?? forceUnoptimized}
      referrerPolicy="no-referrer"
      {...rest}
    />
  );
}

export default SafeImage;

