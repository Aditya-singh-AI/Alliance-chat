import React from 'react';
import { FaUser, FaPalette, FaSignOutAlt, FaChevronLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useUserStore } from '../store/useUserStore';
import { useThemeStore } from '../store/useThemeStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { logoutUser } from '../services/user.service';
import { toast } from 'react-toastify';

export default function Setting() {
  const { user, clearUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();
  const { setActiveTab } = useLayoutStore();

  const isDark = theme === 'dark';

  const handleToggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    toast.info(`Switched to ${next} mode`);
  };

  const handleLogout = async () => {
    try {
      const res = await logoutUser();
      if (res.status === 'success') {
        clearUser();
        toast.success('Logged out successfully');
      }
    } catch {
      toast.error('Failed to log out');
    }
  };

  const menuItems = [
    {
      icon: <FaUser className="text-[#00a884]" />,
      label: 'Edit Profile Details',
      desc: 'Name, photo, about',
      onClick: () => setActiveTab('profile'),
    },
    {
      icon: <FaPalette className="text-[#00a884]" />,
      label: 'Toggle Theme',
      desc: isDark ? 'Currently Dark mode' : 'Currently Light mode',
      onClick: handleToggleTheme,
      badge: isDark ? 'Dark' : 'Light',
    },
  ];

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-[#111b21] text-white' : 'bg-gray-100 text-gray-800'}`}>

      {/* Header */}
      <div className={`p-4 flex items-center space-x-3 border-b ${isDark ? 'bg-[#202c33] border-gray-700' : 'bg-white border-gray-200'}`}>
        <button
          onClick={() => setActiveTab('chats')}
          className={`p-1 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <FaChevronLeft size={18} />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">

        {/* Profile card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={() => setActiveTab('profile')}
          className={`p-4 rounded-2xl flex items-center space-x-4 cursor-pointer shadow-sm ${isDark ? 'bg-[#202c33] hover:bg-[#2a3942]' : 'bg-white hover:bg-gray-50'}`}
        >
          <img
            src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id}`}
            alt={user?.username}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#00a884]"
          />
          <div>
            <h2 className="font-bold text-lg">{user?.username}</h2>
            <p className={`text-sm truncate max-w-[200px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.about || 'Hey there! I am using Talkative.'}
            </p>
          </div>
        </motion.div>

        {/* Menu items */}
        <div className={`rounded-2xl overflow-hidden shadow-sm ${isDark ? 'bg-[#202c33]' : 'bg-white'}`}>
          {menuItems.map((item, idx) => (
            <motion.button
              key={idx}
              whileHover={{ x: 3 }}
              onClick={item.onClick}
              className={`w-full p-4 flex items-center justify-between transition
                ${idx < menuItems.length - 1 ? `border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}` : ''}
                ${isDark ? 'hover:bg-[#2a3942]' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#00a884]/15 flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.desc}</p>
                </div>
              </div>
              {item.badge && (
                <span className="text-xs bg-[#00a884] text-white px-2 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Logout */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full p-4 flex items-center space-x-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition"
        >
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <FaSignOutAlt />
          </div>
          <span className="font-medium text-sm">Sign Out Session</span>
        </motion.button>

        <p className={`text-center text-xs pb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
          Talkative v1.0.0
        </p>
      </div>
    </div>
  );
}
