import { create } from "zustand";
import { persist } from "zustand/middleware";

// Persistent dark/light theme toggle
export const useThemeStore = create(
  persist(
    (set) => ({
      theme: "dark", // Default to dark mode for Talkative's premium aesthetic
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
    }),
    {
      name: "talkative-theme-storage",
    },
  ),
);
