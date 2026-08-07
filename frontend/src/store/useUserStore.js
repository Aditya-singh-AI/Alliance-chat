import { create } from "zustand";
import { persist } from "zustand/middleware";

// User authentication identity and session state
export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (userData) =>
        set({ user: userData, isAuthenticated: !!userData }),
      clearUser: () => set({ user: null, isAuthenticated: false }), // Clears on logout/auth fail
    }),
    {
      name: "talkative-user-storage",
    },
  ),
);
