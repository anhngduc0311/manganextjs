"use client";

import { useEffect, useState } from "react";

export function useLiveReaders(chapterId?: string) {
  const [liveCount, setLiveCount] = useState<number>(1);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!chapterId || typeof window === "undefined") return;

    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource(`/api/realtime/sse?chapterId=${chapterId}`);

        eventSource.onopen = () => {
          setConnected(true);
        };

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (typeof data.liveCount === "number") {
              setLiveCount(data.liveCount);
            }
          } catch {
            // Ignore parse errors
          }
        };

        eventSource.onerror = () => {
          setConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Reconnect after 5 seconds
          retryTimeout = setTimeout(connect, 5000);
        };
      } catch {
        setConnected(false);
      }
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [chapterId]);

  return { liveCount, connected };
}
