import axiosInstance from "./url.service";

// Send OTP to phone or email
export const sendOTP = async (phoneSuffix, phoneNumber, email) => {
  const response = await axiosInstance.post("/auth/send-otp", {
    phoneSuffix,
    phoneNumber,
    email,
  });
  return response.data; // Returns { status, message, data }
};

// Verify the received OTP code
export const verifyOTP = async (phoneNumber, phoneSuffix, email, otp) => {
  const response = await axiosInstance.post("/auth/verify-otp", {
    phoneNumber,
    phoneSuffix,
    email,
    otp,
  });
  return response.data; // Returns { status, message, data: { token, user } }
};

// Update user profile with optional media upload
export const updateUserProfile = async (formData) => {
  const response = await axiosInstance.put("/auth/update-profile", formData, {
    headers: { "Content-Type": "multipart/form-data" }, // Required for Cloudinary uploading
  });
  return response.data;
};

// Check current JWT auth state
export const checkUserAuth = async () => {
  const response = await axiosInstance.get("/auth/check-auth");
  return response.data; // Verifies JWT state on refresh
};

// Logout and clear session cookie
export const logoutUser = async () => {
  const response = await axiosInstance.get("/auth/logout");
  return response.data;
};

// Fetch all users excluding current caller
export const getAllUsers = async () => {
  const response = await axiosInstance.get("/auth/users");
  return response.data; // Fetches contact entries excluding caller
};

// Permanently delete user account and all chat history
export const deleteUserAccount = async () => {
  const response = await axiosInstance.delete("/auth/delete-account");
  return response.data;
};
