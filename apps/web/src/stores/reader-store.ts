import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ReaderMode = "webtoon" | "single";
export type ReaderTheme = "dark" | "light" | "sepia" | "amoled";
export type ReaderImageQuality = "auto" | "saver" | "high" | "original";

interface ReaderState {
  mode: ReaderMode;
  theme: ReaderTheme;
  brightness: number; // 30 -> 100 (%)
  fitWidth: boolean;
  currentPage: number;
  zoom: number; // 50 -> 200 (%)
  isAutoScroll: boolean;
  autoScrollSpeed: number; // 0.5 -> 5 (x)
  imageQuality: ReaderImageQuality;
  preloadAheadCount: number;

  setMode: (mode: ReaderMode) => void;
  setTheme: (theme: ReaderTheme) => void;
  setBrightness: (brightness: number) => void;
  setFitWidth: (fitWidth: boolean) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setIsAutoScroll: (isAutoScroll: boolean) => void;
  toggleAutoScroll: () => void;
  setAutoScrollSpeed: (speed: number) => void;
  setImageQuality: (quality: ReaderImageQuality) => void;
  setPreloadAheadCount: (count: number) => void;
}

const ZOOM_STEPS = [50, 75, 100, 125, 150, 175, 200];

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      mode: "webtoon",
      theme: "dark",
      brightness: 100,
      fitWidth: true,
      currentPage: 1,
      zoom: 100,
      isAutoScroll: false,
      autoScrollSpeed: 2,
      imageQuality: "auto",
      preloadAheadCount: 4,

      setMode: (mode) => set({ mode }),
      setTheme: (theme) => set({ theme }),
      setBrightness: (brightness) => set({ brightness }),
      setFitWidth: (fitWidth) => set({ fitWidth }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      setZoom: (zoom) => set({ zoom: Math.max(50, Math.min(200, zoom)) }),

      zoomIn: () => {
        const current = get().zoom;
        const next = ZOOM_STEPS.find((s) => s > current) || 200;
        set({ zoom: next });
      },

      zoomOut: () => {
        const current = get().zoom;
        const prev = [...ZOOM_STEPS].reverse().find((s) => s < current) || 50;
        set({ zoom: prev });
      },

      setIsAutoScroll: (isAutoScroll) => set({ isAutoScroll }),
      toggleAutoScroll: () => set((state) => ({ isAutoScroll: !state.isAutoScroll })),
      setAutoScrollSpeed: (autoScrollSpeed) => set({ autoScrollSpeed }),
      setImageQuality: (imageQuality) => set({ imageQuality }),
      setPreloadAheadCount: (preloadAheadCount) => set({ preloadAheadCount }),
    }),
    {
      name: "truyenkomi-reader-settings",
      partialize: (state) => ({
        mode: state.mode,
        theme: state.theme,
        brightness: state.brightness,
        fitWidth: state.fitWidth,
        zoom: state.zoom,
        autoScrollSpeed: state.autoScrollSpeed,
        imageQuality: state.imageQuality,
        preloadAheadCount: state.preloadAheadCount,
      }),
    }
  )
);
