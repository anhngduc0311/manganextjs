import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = "info", duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastItem = { id, message, type, duration };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (msg: string, dur?: number) => useToastStore.getState().showToast(msg, "success", dur),
  error: (msg: string, dur?: number) => useToastStore.getState().showToast(msg, "error", dur),
  info: (msg: string, dur?: number) => useToastStore.getState().showToast(msg, "info", dur),
  warning: (msg: string, dur?: number) => useToastStore.getState().showToast(msg, "warning", dur),
};
