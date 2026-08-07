import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useUserStore } from "./store/useUserStore";
import { useChatStore } from "./store/useChatStore";
import { initializeSocket, disconnectSocket } from "./services/chatService";

import { ProtectedRoute, PublicRoute } from "./components/Protected";
import Login from "./pages/user-login/Login";
import Home from "./components/Home";
import StatusPage from "./pages/status-section/StatusPage";
import SettingPage from "./pages/setting-section/SettingPage";

const App = () => {
  const user = useUserStore((state) => state.user);
  const { setCurrentUser, initializeSocketListeners, cleanUp } = useChatStore();

  useEffect(() => {
    if (user && (user._id || user.id)) {
      // 1. Initialise store references
      setCurrentUser(user);

      // 2. Open client socket connection
      const socket = initializeSocket();

      if (socket) {
        // 3. Bind events to state managers
        initializeSocketListeners();
      }
    }

    // Cleanup: disconnect and wipe states on user logout / session ending
    return () => {
      disconnectSocket();
      cleanUp();
    };
  }, [user, setCurrentUser, initializeSocketListeners, cleanUp]);

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
          <Route path="/settings" element={<SettingPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
