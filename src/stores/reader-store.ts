import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ReaderMode = "webtoon" | "single" | "double";
export type ReaderTheme = "dark" | "light" | "sepia" | "amoled";

interface ReaderState {
  mode: ReaderMode;
  theme: ReaderTheme;
  brightness: number; // 30 -> 100 (%)
  fitWidth: boolean;
  currentPage: number;
  setMode: (mode: ReaderMode) => void;
  setTheme: (theme: ReaderTheme) => void;
  setBrightness: (brightness: number) => void;
  setFitWidth: (fitWidth: boolean) => void;
  setCurrentPage: (page: number) => void;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      mode: "webtoon",
      theme: "dark",
      brightness: 100,
      fitWidth: true,
      currentPage: 1,
      setMode: (mode) => set({ mode }),
      setTheme: (theme) => set({ theme }),
      setBrightness: (brightness) => set({ brightness }),
      setFitWidth: (fitWidth) => set({ fitWidth }),
      setCurrentPage: (currentPage) => set({ currentPage }),
    }),
    {
      name: "truyenkomi-reader-settings",
    }
  )
);
