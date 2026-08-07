import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IoChatbubblesSharp, IoTimeSharp, IoSettingsSharp, IoLogOutSharp } from 'react-icons/io5';
import { motion } from 'framer-motion';
import { useUserStore } from '../store/useUserStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useThemeStore } from '../store/useThemeStore';
import { useSocketStore } from '../store/useSocketStore';
import { logoutUser } from '../services/user.service';

const SideBar = ({ isMobile, onThemeClick }) => {
  const { user, clearUser } = useUserStore();
  const { setActiveTab } = useLayoutStore();
  const { theme } = useThemeStore();
  const { disconnect: disconnectSocket } = useSocketStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      // Silently fail — clear user regardless
    } finally {
      disconnectSocket();
      clearUser();
    }
  };

  const handleProfileAvatarClick = () => {
    setActiveTab('settings');
    navigate('/settings');
  };

  const navItems = [
    { id: 'chats', path: '/', label: 'Chats', icon: IoChatbubblesSharp },
    { id: 'status', path: '/status', label: 'Status', icon: IoTimeSharp },
    { id: 'settings', path: '/settings', label: 'Settings', icon: IoSettingsSharp },
  ];

  const isDark = theme === 'dark';

  if (isMobile) {
    // Bottom navigation bar for mobile
    return (
      <div className={`flex flex-row justify-around items-center w-full h-16 border-t absolute bottom-0 z-40 ${
        isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-white border-gray-200 shadow-lg'
      }`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive
                  ? 'text-[#00a884]'
                  : isDark
                  ? 'text-[#8696a0] hover:text-[#e9edef]'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            isDark ? 'text-[#8696a0] hover:text-red-400' : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <IoLogOutSharp className="w-6 h-6" />
          <span className="text-[10px] font-semibold">Logout</span>
        </button>
      </div>
    );
  }

  // Vertical sidebar for desktop
  return (
    <div className={`flex flex-col items-center w-16 h-screen border-r py-5 justify-between select-none z-20 ${
      isDark ? 'bg-[#111b21] border-[#202c33]' : 'bg-[#f0f2f5] border-gray-200'
    }`}>
      {/* Top: Profile avatar — click to open profile settings */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-10 h-10 rounded-full border-2 border-[#00a884] p-[1.5px] overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
        onClick={handleProfileAvatarClick}
        title="Profile Settings"
      >
        <img
          src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id || 'default'}`}
          alt="Profile"
          className="w-full h-full object-cover rounded-full"
        />
      </motion.div>

      {/* Central navigation links */}
      <div className="flex flex-col gap-5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className="relative flex items-center justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#00a884] text-white shadow-md shadow-[#00a884]/20'
                    : isDark
                    ? 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <Icon className="w-5 h-5" />
              </motion.div>

              {/* Active indicator bar */}
              {isActive && (
                <motion.span
                  layoutId="activeBar"
                  className="absolute -left-3 w-1 h-6 bg-[#00a884] rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom: Logout button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        title="Logout"
        className={`p-3 rounded-2xl transition-colors ${
          isDark
            ? 'text-[#8696a0] hover:text-red-400 hover:bg-[#202c33]'
            : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
        }`}
      >
        <IoLogOutSharp className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

export default SideBar;
