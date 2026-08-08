import { create } from 'zustand';
import io from 'socket.io-client';
import { useChatStore } from './useChatStore';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

let globalSocket = null;

export const getGlobalSocket = () => globalSocket;

export const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: new Set(),

  connect: (userId) => {
    if (!userId) return;

    const uid = (typeof userId === 'object' ? userId?._id || userId?.id : userId)?.toString();

    if (globalSocket?.connected) {
      globalSocket.emit('user_connected', uid);
      useChatStore.getState().initializeSocketListeners(globalSocket);
      return;
    }

    const socket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    globalSocket = socket;

    socket.on('connect', () => {
      console.log('Socket connected successfully:', socket.id);
      socket.emit('user_connected', uid);
      useChatStore.getState().initializeSocketListeners(socket);
    });

    // Received initial full list of online users from server
    socket.on('user_status_list', (userArray) => {
      if (Array.isArray(userArray)) {
        const next = new Set(userArray.map((id) => id.toString()));
        set({ onlineUsers: next });
        // Synchronize with chat store
        const onlineMap = new Map();
        userArray.forEach((id) => onlineMap.set(id.toString(), { isOnline: true }));
        useChatStore.setState({ onlineUsers: onlineMap });
      }
    });

    // Received individual online status change
    socket.on('user_status', ({ userId: id, isOnline, lastSeen }) => {
      if (!id) return;
      const strId = id.toString();
      set((state) => {
        const next = new Set(state.onlineUsers);
        if (isOnline) {
          next.add(strId);
        } else {
          next.delete(strId);
        }
        return { onlineUsers: next };
      });
      // Synchronize with chat store
      useChatStore.setState((state) => {
        const nextMap = new Map(state.onlineUsers);
        nextMap.set(strId, { isOnline, lastSeen });
        return { onlineUsers: nextMap };
      });
    });

    set({ socket });
  },

  disconnect: () => {
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
      set({ socket: null, onlineUsers: new Set() });
    }
  },

  isUserOnline: (userId) => {
    if (!userId) return false;
    const strId = (typeof userId === 'object' ? userId?._id || userId?.id : userId)?.toString();
    return get().onlineUsers.has(strId);
  },
}));
