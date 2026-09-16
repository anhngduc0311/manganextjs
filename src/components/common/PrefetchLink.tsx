"use client";

import React, { useCallback, useRef } from "react";
import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";

export interface PrefetchLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>,
    LinkProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PrefetchLink
 * Wraps Next.js Link to trigger aggressive background prefetching on hover / touch / focus.
 * This ensures the destination page payload is loaded before the user completes their click,
 * enabling instantaneous (~0ms) page transitions similar to TruyenGG.
 */
export function PrefetchLink({
  href,
  children,
  className,
  onMouseEnter,
  onTouchStart,
  onFocus,
  prefetch = true,
  ...props
}: PrefetchLinkProps) {
  const router = useRouter();
  const prefetchedRef = useRef(false);

  const handlePrefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    try {
      const url = typeof href === "string" ? href : href.pathname || "";
      if (url && url.startsWith("/")) {
        router.prefetch(url);
      }
    } catch {
      // Ignore prefetch errors silently
    }
  }, [href, router]);

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={className}
      onMouseEnter={(e) => {
        handlePrefetch();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        handlePrefetch();
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        handlePrefetch();
        onFocus?.(e);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}

export default PrefetchLink;
