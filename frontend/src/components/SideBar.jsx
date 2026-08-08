import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IoChatbubblesSharp, IoTimeSharp, IoSettingsSharp, IoLogOutSharp, IoCallSharp } from 'react-icons/io5';
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
    try { await logoutUser(); } catch (e) {} finally { disconnectSocket(); clearUser(); }
  };

  const handleProfileAvatarClick = () => {
    setActiveTab('settings');
    navigate('/settings');
  };

  const navItems = [
    { id: 'chats', path: '/', label: 'Chats', icon: IoChatbubblesSharp },
    { id: 'status', path: '/status', label: 'Status', icon: IoTimeSharp },
    { id: 'calls', path: '/calls', label: 'Calls', icon: IoCallSharp },
    { id: 'settings', path: '/settings', label: 'Settings', icon: IoSettingsSharp },
  ];

  const isDark = theme === 'dark';

  if (isMobile) {
    return (
      <div className={`flex flex-row justify-around items-center w-full h-16 border-t absolute bottom-0 z-40 ${
        isDark ? 'bg-[#18181B]/95 border-[#27272A] backdrop-blur-xl' : 'bg-white/95 border-[#E7E5E4] backdrop-blur-xl shadow-lg'
      }`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.id} to={item.path} onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive ? 'text-[#F97316]' : isDark ? 'text-[#71717A] hover:text-[#FAFAFA]' : 'text-[#A8A29E] hover:text-[#0C0A09]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.label}</span>
              {isActive && <motion.div layoutId="mobileTab" className="w-5 h-0.5 accent-gradient rounded-full" />}
            </Link>
          );
        })}
        <button onClick={handleLogout}
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${isDark ? 'text-[#71717A] hover:text-red-400' : 'text-[#A8A29E] hover:text-red-500'}`}
        >
          <IoLogOutSharp className="w-5 h-5" />
          <span className="text-[10px] font-bold">Exit</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center w-[72px] h-screen py-5 justify-between select-none z-20 ${
      isDark ? 'bg-[#18181B] border-r border-[#27272A]' : 'bg-white border-r border-[#E7E5E4]'
    }`}>
      {/* Top: Profile avatar */}
      <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        className="w-10 h-10 rounded-xl accent-gradient p-[2px] cursor-pointer shadow-md shadow-orange-500/15 hover:shadow-orange-500/25 transition-shadow"
        onClick={handleProfileAvatarClick} title="Profile"
      >
        <div className={`w-full h-full rounded-[10px] overflow-hidden ${isDark ? 'bg-[#09090B]' : 'bg-white'}`}>
          <img src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id || 'default'}`}
            alt="Profile" className="w-full h-full object-cover"
          />
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.id} to={item.path} onClick={() => setActiveTab(item.id)} title={item.label}
              className="relative flex items-center justify-center"
            >
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'accent-gradient text-white shadow-md shadow-orange-500/20'
                    : isDark
                      ? 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A]'
                      : 'text-[#A8A29E] hover:text-[#0C0A09] hover:bg-[#F5F5F4]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={handleLogout} title="Logout"
        className={`p-3 rounded-xl transition-all ${isDark ? 'text-[#71717A] hover:text-red-400 hover:bg-red-500/10' : 'text-[#A8A29E] hover:text-red-500 hover:bg-red-50'}`}
      >
        <IoLogOutSharp className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

export default SideBar;
