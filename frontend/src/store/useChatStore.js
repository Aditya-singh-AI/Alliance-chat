import { create } from "zustand";
import axiosInstance from "../services/url.service";
import { getGlobalSocket, useSocketStore } from "./useSocketStore";

let typingTimerMap = new Map(); // userId -> setTimeout ID

export const useChatStore = create((set, get) => ({
  // --- States ---
  conversations: { data: [] },
  currentConversation: null,
  messages: [],
  currentUser: null,
  loading: false,
  error: null,
  onlineUsers: new Map(),
  typingUsers: new Map(), // conversationId or userId -> Set of userIds

  // --- Actions ---

  initializeSocketListeners: (passedSocket) => {
    const socket = passedSocket || getGlobalSocket();
    if (!socket) return;

    // 1. Remove duplicate listeners
    socket.off("received_message");
    socket.off("receiveMessage");
    socket.off("messageSent");
    socket.off("message_status_update");
    socket.off("messageStatusUpdate");
    socket.off("reaction_update");
    socket.off("reactionUpdate");
    socket.off("message_deleted");
    socket.off("messageDeleted");
    socket.off("messageError");
    socket.off("user_typing");
    socket.off("userTyping");
    socket.off("user_status");
    socket.off("userStatus");
    socket.off("user_status_list");

    // 2. Register Active Listeners

    socket.on("received_message", (message) => {
      get().receiveMessage(message);
    });
    socket.on("receiveMessage", (message) => {
      get().receiveMessage(message);
    });

    socket.on("messageSent", (message) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          (msg._id === message._id || msg.id === message.id) ? message : msg
        ),
      }));
    });

    socket.on("message_status_update", ({ messageId, messageStatus }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          (msg._id === messageId || msg.id === messageId) ? { ...msg, messageStatus } : msg
        ),
      }));
    });

    socket.on("reaction_update", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          (msg._id === messageId || msg.id === messageId) ? { ...msg, reactions } : msg
        ),
      }));
    });

    socket.on("message_deleted", (deletedMessageId) => {
      set((state) => ({
        messages: state.messages.filter(
          (msg) => msg._id !== deletedMessageId && msg.id !== deletedMessageId
        ),
      }));
    });

    // Typing status update with safety timer auto-cleanup
    socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
      const uId = userId?.toString();
      const cId = conversationId?.toString() || 'global';
      if (!uId) return;

      // Clear existing auto-stop timer for this user
      if (typingTimerMap.has(uId)) {
        clearTimeout(typingTimerMap.get(uId));
        typingTimerMap.delete(uId);
      }

      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        if (!newTypingUsers.has(cId)) {
          newTypingUsers.set(cId, new Set());
        }
        const typingSet = newTypingUsers.get(cId);
        if (isTyping) {
          typingSet.add(uId);
        } else {
          typingSet.delete(uId);
        }
        return { typingUsers: newTypingUsers };
      });

      // If user started typing, auto-expire after 3 seconds as fail-safe
      if (isTyping) {
        const timerId = setTimeout(() => {
          set((state) => {
            const nextMap = new Map(state.typingUsers);
            if (nextMap.has(cId)) {
              nextMap.get(cId).delete(uId);
            }
            return { typingUsers: nextMap };
          });
          typingTimerMap.delete(uId);
        }, 3000);
        typingTimerMap.set(uId, timerId);
      }
    });

    socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
      if (!userId) return;
      const uId = userId.toString();
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(uId, { isOnline, lastSeen });
        return { onlineUsers: newOnlineUsers };
      });
    });

    socket.on("user_status_list", (userArray) => {
      if (Array.isArray(userArray)) {
        set((state) => {
          const newOnlineUsers = new Map(state.onlineUsers);
          userArray.forEach((id) => newOnlineUsers.set(id.toString(), { isOnline: true }));
          return { onlineUsers: newOnlineUsers };
        });
      }
    });
  },

  setCurrentUser: (user) => {
    set({ currentUser: user });
  },

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/chat/conversations");
      set({ conversations: { data: data.data || [] }, loading: false });
      get().initializeSocketListeners();
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      set({ error: errMsg, loading: false });
      return null;
    }
  },

  fetchMessages: async (conversationId) => {
    if (!conversationId) return;
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get(
        `/chat/conversations/${conversationId}/messages`
      );
      const messageArray = data.data || data || [];
      set({
        messages: messageArray,
        currentConversation: conversationId.toString(),
        loading: false,
      });

      get().markAsRead();
      return messageArray;
    } catch (err) {
      set({ error: err.message, loading: false });
      return [];
    }
  },

  sendMessage: async (formData) => {
    const socket = getGlobalSocket();
    const conversations = get().conversations;

    const senderId = formData.get("senderId");
    const receiverId = formData.get("receiverId");
    const content = formData.get("content");
    const media = formData.get("media");
    const messageStatus = formData.get("messageStatus");

    let conversationId = get().currentConversation;

    if (!conversationId && conversations.data && conversations.data.length > 0) {
      const matchingConv = conversations.data.find(
        (conv) =>
          conv.participants &&
          conv.participants.some((p) => (p._id || p.id)?.toString() === senderId?.toString()) &&
          conv.participants.some((p) => (p._id || p.id)?.toString() === receiverId?.toString())
      );
      if (matchingConv) {
        conversationId = (matchingConv._id || matchingConv.id)?.toString();
        set({ currentConversation: conversationId });
      }
    }

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      id: tempId,
      sender: { _id: senderId, id: senderId },
      receiver: { _id: receiverId, id: receiverId },
      conversation: conversationId,
      content: content,
      contentType:
        media && media instanceof File
          ? media.type.startsWith("image")
            ? "image"
            : "video"
          : "text",
      mediaUrl: media && media instanceof File ? URL.createObjectURL(media) : null,
      imageOrVideoUrl: media && media instanceof File ? URL.createObjectURL(media) : null,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      messageStatus: messageStatus || "sending",
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const { data } = await axiosInstance.post(
        "/chat/send-message",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const messageData = data.data || data;

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId || msg.id === tempId ? messageData : msg
        ),
      }));

      // Emit via active socket for real-time delivery to receiver
      if (socket) {
        socket.emit("send_message", messageData);
      }

      return messageData;
    } catch (err) {
      console.error("Error sending message:", err);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId || msg.id === tempId
            ? { ...msg, messageStatus: "failed" }
            : msg
        ),
        error: err.response?.data?.message || err.message,
      }));
      throw err;
    }
  },

  receiveMessage: (message) => {
    if (!message) return;

    const currentConv = get().currentConversation;
    const messages = get().messages;

    const msgId = (message._id || message.id)?.toString();
    const msgConvId = (message.conversation?._id || message.conversation?.id || message.conversation)?.toString();

    // Prevent duplicate messages
    const exists = messages.some((msg) => (msg._id || msg.id)?.toString() === msgId);
    if (exists) return;

    const currentConvStr = currentConv ? currentConv.toString() : null;

    // Append message if conversation matches or if no conversation selected
    if (!currentConvStr || currentConvStr === msgConvId) {
      set((state) => ({
        messages: [...state.messages, message],
      }));
      get().markAsRead();
    }

    // Refresh conversation list to update sidebar preview
    get().fetchConversations();
  },

  markAsRead: async () => {
    const { messages, currentUser } = get();
    if (!messages.length || !currentUser) return;

    const currentUserId = (currentUser._id || currentUser.id)?.toString();

    const unreadIds = messages
      .filter((msg) => {
        const receiverId = (msg.receiver?._id || msg.receiver?.id || msg.receiver)?.toString();
        return msg.messageStatus !== "read" && receiverId === currentUserId;
      })
      .map((msg) => msg._id || msg.id);

    if (unreadIds.length === 0) return;

    try {
      await axiosInstance.put("/chat/messages/read", { messageIds: unreadIds });
      set((state) => ({
        messages: state.messages.map((msg) =>
          unreadIds.includes(msg._id || msg.id)
            ? { ...msg, messageStatus: "read" }
            : msg
        ),
      }));
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/chat/messages/${messageId}`);
      set((state) => ({
        messages: state.messages.filter(
          (msg) => msg._id !== messageId && msg.id !== messageId
        ),
      }));
      return true;
    } catch (err) {
      console.error("Error deleting message:", err);
      set({ error: err.response?.data?.message || err.message });
      return false;
    }
  },

  addReaction: (messageId, emoji) => {
    const socket = getGlobalSocket();
    const currentUser = get().currentUser;
    if (socket && currentUser) {
      socket.emit("add_reaction", {
        messageId,
        emoji,
        reactionUserId: currentUser._id || currentUser.id,
      });
    }
  },

  startTyping: (receiverId) => {
    const socket = getGlobalSocket();
    const currentConv = get().currentConversation;
    const currentUser = get().currentUser;
    const rId = (typeof receiverId === 'object' ? receiverId?._id || receiverId?.id : receiverId)?.toString();
    const uId = (currentUser?._id || currentUser?.id)?.toString();

    if (socket && rId && uId) {
      socket.emit("typing_start", {
        conversationId: currentConv || 'global',
        receiverId: rId,
        userId: uId,
      });
    }
  },

  stopTyping: (receiverId) => {
    const socket = getGlobalSocket();
    const currentConv = get().currentConversation;
    const currentUser = get().currentUser;
    const rId = (typeof receiverId === 'object' ? receiverId?._id || receiverId?.id : receiverId)?.toString();
    const uId = (currentUser?._id || currentUser?.id)?.toString();

    if (socket && rId && uId) {
      socket.emit("typing_stop", {
        conversationId: currentConv || 'global',
        receiverId: rId,
        userId: uId,
      });
    }
  },

  isUserTyping: (userId, conversationId) => {
    if (!userId) return false;
    const uId = userId.toString();
    const cId = conversationId ? conversationId.toString() : 'global';

    const setByConv = get().typingUsers.get(cId);
    if (setByConv && setByConv.has(uId)) return true;

    for (let [, setOfUsers] of get().typingUsers.entries()) {
      if (setOfUsers && setOfUsers.has(uId)) return true;
    }
    return false;
  },

  isUserOnline: (userId) => {
    if (!userId) return false;
    const uId = (typeof userId === 'object' ? userId?._id || userId?.id : userId)?.toString();

    const userObj = get().onlineUsers.get(uId);
    if (userObj && userObj.isOnline) return true;

    return useSocketStore.getState().isUserOnline(uId);
  },

  getUserLastSeen: (userId) => {
    if (!userId) return null;
    const uId = (typeof userId === 'object' ? userId?._id || userId?.id : userId)?.toString();
    const userObj = get().onlineUsers.get(uId);
    return userObj ? userObj.lastSeen : null;
  },

  cleanUp: () => {
    set({
      conversations: { data: [] },
      currentConversation: null,
      messages: [],
      onlineUsers: new Map(),
      typingUsers: new Map(),
    });
  },
}));
