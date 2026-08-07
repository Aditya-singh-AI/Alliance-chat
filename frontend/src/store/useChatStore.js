import { create } from "zustand";
import axiosInstance from "../services/url.service"; // Custom Axios instance with baseURL
import { getSocket } from "../services/chatService";

export const useChatStore = create((set, get) => ({
  // --- States ---
  conversations: { data: [] },
  currentConversation: null, // Holds current conversation ID
  messages: [],
  currentUser: null,
  loading: false,
  error: null,
  onlineUsers: new Map(), // Map of userId -> { isOnline, lastSeen }
  typingUsers: new Map(), // Map of conversationId -> Set of typing userIds

  // --- Actions ---

  /**
   * Sets up Socket.IO event listeners.
   * Cleans up existing listeners first to prevent duplicates upon re-initialisation.
   */
  initializeSocketListeners: (passedSocket) => {
    const socket = passedSocket || getSocket();
    if (!socket) return;

    // 1. Remove duplicate listeners to prevent memory leaks or duplicate rendering
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

    // 2. Register Active Listeners

    // Listen for incoming messages in real-time (both event name variants)
    socket.on("received_message", (message) => {
      get().receiveMessage(message);
    });
    socket.on("receiveMessage", (message) => {
      get().receiveMessage(message);
    });

    // Confirm message delivery from server
    socket.on("messageSent", (message) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === message._id || msg.id === message.id ? message : msg,
        ),
      }));
    });

    // Update message status (e.g., delivered, read) — supports both event name conventions
    socket.on("message_status_update", ({ messageId, messageStatus }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId || msg.id === messageId
            ? { ...msg, messageStatus }
            : msg,
        ),
      }));
    });
    socket.on("messageStatusUpdate", (messageId, messageStatus) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId || msg.id === messageId
            ? { ...msg, messageStatus }
            : msg,
        ),
      }));
    });

    // Receive message reaction updates (emojis)
    socket.on("reaction_update", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId || msg.id === messageId
            ? { ...msg, reactions }
            : msg,
        ),
      }));
    });
    socket.on("reactionUpdate", (messageId, reactions) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId || msg.id === messageId
            ? { ...msg, reactions }
            : msg,
        ),
      }));
    });

    // Handle real-time deleted messages
    socket.on("message_deleted", (deletedMessageId) => {
      set((state) => ({
        messages: state.messages.filter(
          (msg) => msg._id !== deletedMessageId && msg.id !== deletedMessageId,
        ),
      }));
    });
    socket.on("messageDeleted", (deletedMessageId) => {
      set((state) => ({
        messages: state.messages.filter(
          (msg) => msg._id !== deletedMessageId && msg.id !== deletedMessageId,
        ),
      }));
    });

    // Error messages sent via socket
    socket.on("messageError", (error) => {
      console.error("Message socket error:", error);
    });

    // Tracks which users are currently typing in a specific conversation
    socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        if (!newTypingUsers.has(conversationId)) {
          newTypingUsers.set(conversationId, new Set());
        }
        const typingSet = newTypingUsers.get(conversationId);
        if (isTyping) {
          typingSet.add(userId);
        } else {
          typingSet.delete(userId);
        }
        return { typingUsers: newTypingUsers };
      });
    });
    socket.on("userTyping", (userId, conversationId, isTyping) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        if (!newTypingUsers.has(conversationId)) {
          newTypingUsers.set(conversationId, new Set());
        }
        const typingSet = newTypingUsers.get(conversationId);
        if (isTyping) {
          typingSet.add(userId);
        } else {
          typingSet.delete(userId);
        }
        return { typingUsers: newTypingUsers };
      });
    });

    // Track online/offline status updates
    socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(userId, { isOnline, lastSeen });
        return { onlineUsers: newOnlineUsers };
      });
    });
    socket.on("userStatus", (userId, isOnline, lastSeen) => {
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(userId, { isOnline, lastSeen });
        return { onlineUsers: newOnlineUsers };
      });
    });
  },

  /**
   * Sets the current logged-in user in chat store to reference during chat events.
   */
  setCurrentUser: (user) => {
    set({ currentUser: user });
  },

  /**
   * Fetches all active conversations for the current user.
   */
  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/chat/conversations");
      set({ conversations: { data: data.data || [] }, loading: false });

      // Initialise socket event listeners right after conversations load
      get().initializeSocketListeners();
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      set({ error: errMsg, loading: false });
      return null;
    }
  },

  /**
   * Fetches messages for a specific conversation.
   */
  fetchMessages: async (conversationId) => {
    if (!conversationId) return;
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get(
        `/chat/conversations/${conversationId}/messages`,
      );
      const messageArray = data.data || data || [];
      set({
        messages: messageArray,
        currentConversation: conversationId,
        loading: false,
      });

      // Mark fetched messages as read automatically
      get().markAsRead();
      return messageArray;
    } catch (err) {
      set({ error: err.message, loading: false });
      return [];
    }
  },

  /**
   * Sends a message with optimistic UI updates.
   */
  sendMessage: async (formData) => {
    const socket = getSocket();
    const conversations = get().conversations;

    const senderId = formData.get("senderId");
    const receiverId = formData.get("receiverId");
    const content = formData.get("content");
    const media = formData.get("media");
    const messageStatus = formData.get("messageStatus");

    let conversationId = null;

    // Locate active conversation matching sender and receiver
    if (conversations.data && conversations.data.length > 0) {
      const matchingConv = conversations.data.find(
        (conv) =>
          conv.participants &&
          conv.participants.some((p) => (p._id || p.id) === senderId) &&
          conv.participants.some((p) => (p._id || p.id) === receiverId),
      );
      if (matchingConv) {
        conversationId = matchingConv._id || matchingConv.id;
        set({ currentConversation: conversationId });
      }
    }

    // Create optimistic mock message for fluid UI experience
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
      mediaUrl:
        media && media instanceof File ? URL.createObjectURL(media) : null,
      imageOrVideoUrl:
        media && media instanceof File ? URL.createObjectURL(media) : null,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      messageStatus: messageStatus || "sending",
    };

    // Render immediately in state
    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const { data } = await axiosInstance.post(
        "/chat/send-message",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      const messageData = data.data || data;

      // Replace optimistic message with the real message returned from DB
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId || msg.id === tempId ? messageData : msg,
        ),
      }));

      // Also emit via socket for real-time delivery to receiver
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
            : msg,
        ),
        error: err.response?.data?.message || err.message,
      }));
      throw err;
    }
  },

  /**
   * Appends incoming real-time messages to the state safely.
   */
  receiveMessage: (message) => {
    if (!message) return;
    const currentConv = get().currentConversation;
    const messages = get().messages;

    const msgId = (message._id || message.id)?.toString();
    const msgConvId = (message.conversation?._id || message.conversation?.id || message.conversation)?.toString();

    // Prevent duplicate messages
    const exists = messages.some((msg) => (msg._id || msg.id)?.toString() === msgId);
    if (exists) return;

    // Check string match on conversation ID
    const currentConvStr = currentConv ? currentConv.toString() : null;
    const isConvMatch = currentConvStr && msgConvId && (currentConvStr === msgConvId);

    if (isConvMatch || !currentConvStr) {
      set((state) => ({
        messages: [...state.messages, message],
      }));
      get().markAsRead();
    }

    // Refresh conversation list to keep sidebar preview and unread counters synchronized
    get().fetchConversations();
  },

  /**
   * Marks unread messages in the current conversation as read.
   */
  markAsRead: async () => {
    const { messages, currentUser } = get();
    if (!messages.length || !currentUser) return;

    const currentUserId = currentUser._id || currentUser.id;

    const unreadIds = messages
      .filter((msg) => {
        const receiverId =
          msg.receiver?._id || msg.receiver?.id || msg.receiver;
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
            : msg,
        ),
      }));
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  },

  /**
   * Deletes a specific message.
   */
  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/chat/messages/${messageId}`);
      set((state) => ({
        messages: state.messages.filter(
          (msg) => msg._id !== messageId && msg.id !== messageId,
        ),
      }));
      return true;
    } catch (err) {
      console.error("Error deleting message:", err);
      set({ error: err.response?.data?.message || err.message });
      return false;
    }
  },

  /**
   * Emits a reaction update (Emoji) on a message via Socket.IO.
   */
  addReaction: (messageId, emoji) => {
    const socket = getSocket();
    const currentUser = get().currentUser;
    if (socket && currentUser) {
      socket.emit("add_reaction", {
        messageId,
        emoji,
        reactionUserId: currentUser._id || currentUser.id,
      });
    }
  },

  /**
   * Emits that typing has started in current conversation.
   */
  startTyping: (receiverId) => {
    const socket = getSocket();
    const currentConv = get().currentConversation;
    const currentUser = get().currentUser;
    if (socket && currentConv && receiverId) {
      socket.emit("typing_start", {
        conversationId: currentConv,
        receiverId,
        userId: currentUser?._id || currentUser?.id,
      });
    }
  },

  /**
   * Emits that typing has stopped.
   */
  stopTyping: (receiverId) => {
    const socket = getSocket();
    const currentConv = get().currentConversation;
    const currentUser = get().currentUser;
    if (socket && currentConv && receiverId) {
      socket.emit("typing_stop", {
        conversationId: currentConv,
        receiverId,
        userId: currentUser?._id || currentUser?.id,
      });
    }
  },

  // Helper selectors
  isUserTyping: (userId, conversationId) => {
    const sets = get().typingUsers.get(conversationId);
    return sets ? sets.has(userId) : false;
  },

  isUserOnline: (userId) => {
    const userObj = get().onlineUsers.get(userId);
    return userObj ? userObj.isOnline : false;
  },

  getUserLastSeen: (userId) => {
    const userObj = get().onlineUsers.get(userId);
    return userObj ? userObj.lastSeen : null;
  },

  /**
   * Resets the store when chat session ends or components unmount.
   */
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
