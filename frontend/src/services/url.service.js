import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Global Axios instance with persistent cookie sessions
const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // Enables cookie storage/reading for JWT
});

export default axiosInstance;
