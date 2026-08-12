import { useUserStore } from "../store/useUserStore";
import { useChatStore } from "../store/useChatStore";
import { useLayoutStore } from "../store/useLayoutStore";
import { useSocketStore } from "../store/useSocketStore";
import useVideoCallStore from "../store/useVideoCallStore";

/**
 * Completely resets all application stores, disconnects WebSockets,
 * and clears stored session layout to prevent cross-user data leaks.
 */
export const resetAllStores = () => {
  try {
    // 1. Disconnect socket connection
    useSocketStore.getState().disconnect();

    // 2. Clear Chat store memory
    useChatStore.getState().cleanUp();

    // 3. Reset Layout store (selected contact & active tab)
    useLayoutStore.getState().clearSelectedContact();
    useLayoutStore.getState().setActiveTab("chats");

    // 4. End video call state if any active
    useVideoCallStore.getState().endCall();

    // 5. Clear User store
    useUserStore.getState().clearUser();

    // 6. Remove talkative layout storage from localStorage
    localStorage.removeItem("talkative-layout-storage");
  } catch (err) {
    console.error("Error resetting application stores:", err);
  }
};
