import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { checkUserAuth } from '../services/user.service';
import Loader from '../utils/Loader';

// ==========================================
// Guarded Route: Users MUST be logged in
// ==========================================
export const ProtectedRoute = () => {
  const { isAuthenticated, setUser, clearUser } = useUserStore();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await checkUserAuth();
        if (response.status === 'success' && response.data) {
          setUser(response.data); // Store returned profile details
        } else {
          clearUser();
        }
      } catch (error) {
        clearUser(); // Purge caches on auth fail
      } finally {
        setIsChecking(false);
      }
    };
    verifyAuth();
  }, [setUser, clearUser]);

  // Show full-screen loader while verifying session
  if (isChecking) return <Loader />;

  return isAuthenticated ? (
    <Outlet /> // Render children when authenticated
  ) : (
    <Navigate to="/login" state={{ from: location }} replace /> // Redirect to login
  );
};

// ==========================================
// Public Route: Redirect to dashboard if already logged in
// ==========================================
export const PublicRoute = () => {
  const { isAuthenticated } = useUserStore();
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};
