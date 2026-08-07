import axiosInstance from "./url.service";

export const getStatuses = async () => {
  try {
    const res = await axiosInstance.get("/status");
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const createStatus = async (formData) => {
  try {
    const res = await axiosInstance.post("/status", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const deleteStatus = async (statusId) => {
  try {
    const res = await axiosInstance.delete(`/status/${statusId}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};

export const viewStatus = async (statusId) => {
  try {
    const res = await axiosInstance.put(`/status/${statusId}/view`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err.message;
  }
};
