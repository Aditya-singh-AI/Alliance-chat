import { getGlobalSocket, useSocketStore } from "../store/useSocketStore";
import { useUserStore } from "../store/useUserStore";

export const initializeSocket = () => {
  const user = useUserStore.getState().user;
  const userId = user?._id || user?.id;
  if (userId) {
    useSocketStore.getState().connect(userId);
  }
  return getGlobalSocket();
};

export const getSocket = () => {
  const socket = getGlobalSocket();
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  useSocketStore.getState().disconnect();
};
