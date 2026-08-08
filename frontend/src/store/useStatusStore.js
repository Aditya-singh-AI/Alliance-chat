import { create } from "zustand";
import axiosInstance from "../services/url.service";

const useStatusStore = create((set, get) => ({
  // State
  status: [],
  loading: false,
  error: null,

  // Actions
  setStatuses: (status) => set({ status }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Initialize Socket Listeners for Real-time Status updates
  initializeSocket: (socket) => {
    if (!socket) return;

    socket.on("newStatus", (newStatus) => {
      set((state) => {
        const exists = state.status.some((s) => s._id === newStatus._id);
        const updated = exists
          ? state.status.map((s) => (s._id === newStatus._id ? newStatus : s))
          : [newStatus, ...state.status];
        return { status: updated };
      });
    });

    socket.on("statusDeleted", (statusId) => {
      set((state) => ({
        status: state.status.filter((s) => s._id !== statusId),
      }));
    });

    socket.on("statusViewed", ({ statusId, viewers }) => {
      set((state) => ({
        status: state.status.map((s) => {
          if (s._id === statusId) {
            return { ...s, viewers };
          }
          return s;
        }),
      }));
    });
  },

  // Cleanup Socket Listeners
  cleanupSocket: (socket) => {
    if (!socket) return;
    socket.off("newStatus");
    socket.off("statusDeleted");
    socket.off("statusViewed");
  },

  // Fetch all statuses
  fetchStatuses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get("/status");
      set({ status: response.data?.data || response.data || [], loading: false });
    } catch (error) {
      console.error("Error fetching statuses:", error);
      set({ error: error.response?.data?.message || error.message, loading: false });
    }
  },

  // Create new status
  createStatus: async (statusData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      if (statusData.file) {
        formData.append("media", statusData.file);
      }
      if (statusData.content && statusData.content.trim()) {
        formData.append("content", statusData.content);
      }

      const response = await axiosInstance.post("/status", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newStatus = response.data?.data || response.data;
      if (newStatus) {
        set((state) => ({
          status: [newStatus, ...state.status],
          loading: false,
        }));
      }
      return newStatus;
    } catch (error) {
      console.error("Error creating status:", error);
      set({ error: error.response?.data?.message || error.message, loading: false });
      throw error;
    }
  },

  // View status (Mark as read)
  viewStatus: async (statusId) => {
    try {
      const response = await axiosInstance.put(`/status/${statusId}/view`);
      const updatedStatus = response.data?.data || response.data;

      if (updatedStatus) {
        set((state) => ({
          status: state.status.map((s) => (s._id === statusId ? updatedStatus : s)),
        }));
      }
    } catch (error) {
      console.error("Error viewing status:", error);
    }
  },

  // Delete status
  deleteStatus: async (statusId) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.delete(`/status/${statusId}`);
      set((state) => ({
        status: state.status.filter((s) => s._id !== statusId),
        loading: false,
      }));
    } catch (error) {
      console.error("Error deleting status:", error);
      set({ error: error.response?.data?.message || error.message, loading: false });
    }
  },

  // Get view list for a status
  getStatusViewers: async (statusId) => {
    try {
      const response = await axiosInstance.get(`/status/${statusId}/viewers`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Error getting status viewers:", error);
      return [];
    }
  },

  // Grouped status helpers (Internal selector/logic)
  getGroupedStatuses: () => {
    const { status } = get();
    return status.reduce((acc, current) => {
      const userId = current.user?._id || current.user?.id;
      if (!userId) return acc;

      if (!acc[userId]) {
        acc[userId] = {
          id: userId,
          name: current.user?.username || "Unknown User",
          avatar: current.user?.profilePicture || null,
          statuses: [],
        };
      }

      acc[userId].statuses.push({
        id: current._id || current.id,
        media: current.media || current.content,
        contentType: current.contentType || current.content_type || "text",
        timestamp: current.createdAt || current.created_at,
        viewers: current.viewers || [],
      });

      return acc;
    }, {});
  },

  // Fetch status for current user
  getUserStatuses: (userId) => {
    const grouped = get().getGroupedStatuses();
    return grouped[userId] || null;
  },

  // Fetch status of other users
  getOtherStatuses: (userId) => {
    const grouped = get().getGroupedStatuses();
    return Object.values(grouped).filter((group) => group.id !== userId);
  },

  clearError: () => set({ error: null }),
  reset: () => set({ status: [], loading: false, error: null }),
}));

export default useStatusStore;
