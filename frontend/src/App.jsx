import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useUserStore } from "./store/useUserStore";
import { useChatStore } from "./store/useChatStore";
import { useSocketStore } from "./store/useSocketStore";

import { ProtectedRoute, PublicRoute } from "./components/Protected";
import Login from "./pages/user-login/Login";
import Home from "./components/Home";
import StatusPage from "./pages/status-section/StatusPage";
import CallsPage from "./pages/calls-section/CallsPage";
import SettingPage from "./pages/setting-section/SettingPage";

const App = () => {
  const user = useUserStore((state) => state.user);
  const { setCurrentUser, initializeSocketListeners, cleanUp } = useChatStore();
  const connectSocket = useSocketStore((state) => state.connect);
  const disconnectSocket = useSocketStore((state) => state.disconnect);

  const userId = user?._id || user?.id;

  useEffect(() => {
    if (userId) {
      setCurrentUser(user);
      connectSocket(userId);
      initializeSocketListeners();
    }

    return () => {
      if (!userId) {
        disconnectSocket();
        cleanUp();
      }
    };
  }, [userId, user, setCurrentUser, connectSocket, initializeSocketListeners, disconnectSocket, cleanUp]);

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <Routes>
        {/* Public routes — redirect to / if already logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected routes — redirect to /login if not authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/calls" element={<CallsPage />} />
          <Route path="/settings" element={<SettingPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
