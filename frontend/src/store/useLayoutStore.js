import { create } from "zustand";
import { persist } from "zustand/middleware";

// Layout configuration: active tab and selected contact window
export const useLayoutStore = create(
  persist(
    (set) => ({
      activeTab: "chats", // Standard default view
      selectedContact: null, // Currently active chat contact
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedContact: (contact) => set({ selectedContact: contact }),
      clearSelectedContact: () => set({ selectedContact: null }),
    }),
    {
      name: "talkative-layout-storage",
    },
  ),
);
