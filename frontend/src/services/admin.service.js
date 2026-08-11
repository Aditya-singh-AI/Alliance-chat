import axiosInstance from "./url.service";

// Fetch all registered users with system stats for Admin
export const getAdminUsers = async () => {
  const response = await axiosInstance.get("/admin/users");
  return response.data;
};

// Create/register a new user as Admin
export const createAdminUser = async (userData) => {
  const response = await axiosInstance.post("/admin/users", userData);
  return response.data;
};

// Update user details as Admin
export const updateAdminUser = async (userId, userData) => {
  const response = await axiosInstance.put(`/admin/users/${userId}`, userData);
  return response.data;
};

// Delete user registration permanently as Admin
export const deleteAdminUser = async (userId) => {
  const response = await axiosInstance.delete(`/admin/users/${userId}`);
  return response.data;
};
