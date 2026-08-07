import axios from "axios";

const rawUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
// Clean trailing slash if present
const cleanUrl = rawUrl.replace(/\/+$/, "");

// Global Axios instance with persistent cookie sessions
const axiosInstance = axios.create({
  baseURL: `${cleanUrl}/api`,
  withCredentials: true,
  timeout: 30000, // 30 second timeout for Render free-tier cold starts
});

export default axiosInstance;
