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

    if (globalSocket?.connected) {
      globalSocket.emit('user_connected', userId);
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
      socket.emit('user_connected', userId);
      useChatStore.getState().initializeSocketListeners(socket);
    });

    socket.on('user_status', ({ userId: uid, isOnline }) => {
      set((state) => {
        const next = new Set(state.onlineUsers);
        if (isOnline) {
          next.add(uid);
        } else {
          next.delete(uid);
        }
        return { onlineUsers: next };
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
    return get().onlineUsers.has(userId);
  },
}));
