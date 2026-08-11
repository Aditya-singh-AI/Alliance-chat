import axiosInstance from "./url.service";

export const getConversations = async () => {
  try {
    const res = await axiosInstance.get("/chat/conversations");
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const getMessages = async (conversationId) => {
  try {
    const res = await axiosInstance.get(
      `/chat/conversations/${conversationId}/messages`,
    );
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const sendMessage = async (formData) => {
  try {
    const res = await axiosInstance.post("/chat/send-message", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const deleteMessage = async (messageId) => {
  try {
    const res = await axiosInstance.delete(`/chat/messages/${messageId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const markAsRead = async (messageIds) => {
  try {
    const res = await axiosInstance.put("/chat/messages/read", { messageIds });
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    const res = await axiosInstance.delete(`/chat/conversations/${conversationId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};
