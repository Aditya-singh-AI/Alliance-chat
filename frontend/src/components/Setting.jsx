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
      if (res.status === 'success') { clearUser(); toast.success('Logged out successfully'); }
    } catch { toast.error('Failed to log out'); }
  };

  const menuItems = [
    { icon: <FaUser className="text-[#F97316]" />, label: 'Edit Profile', desc: 'Name, photo, about', onClick: () => setActiveTab('profile') },
    { icon: <FaPalette className="text-[#F97316]" />, label: 'Toggle Theme', desc: isDark ? 'Currently Dark mode' : 'Currently Light mode', onClick: handleToggleTheme, badge: isDark ? 'Dark' : 'Light' },
  ];

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-[#18181B] text-[#FAFAFA]' : 'bg-[#FAFAF9] text-[#0C0A09]'}`}>
      <div className={`p-4 flex items-center space-x-3 border-b ${isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'}`}>
        <button onClick={() => setActiveTab('chats')} className={`p-1.5 rounded-xl ${isDark ? 'hover:bg-[#27272A]' : 'hover:bg-[#F5F5F4]'}`}>
          <FaChevronLeft size={16} />
        </button>
        <h1 className="text-xl font-extrabold">Settings</h1>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <motion.div whileHover={{ scale: 1.01 }} onClick={() => setActiveTab('profile')}
          className={`p-4 rounded-2xl flex items-center space-x-4 cursor-pointer border ${isDark ? 'bg-[#27272A] border-[#3F3F46] hover:border-[#F97316]/30' : 'bg-white border-[#E7E5E4] hover:border-[#F97316]/30 shadow-sm'}`}
        >
          <div className="w-14 h-14 rounded-xl accent-gradient p-[2px]">
            <div className={`w-full h-full rounded-[10px] overflow-hidden ${isDark ? 'bg-[#09090B]' : 'bg-white'}`}>
              <img src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id}`} alt={user?.username} className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <h2 className="font-extrabold">{user?.username}</h2>
            <p className={`text-sm truncate max-w-[200px] ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>{user?.about || 'Hey there! I am using Alliance.'}</p>
          </div>
        </motion.div>

        <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-[#27272A] border-[#3F3F46]' : 'bg-white border-[#E7E5E4] shadow-sm'}`}>
          {menuItems.map((item, idx) => (
            <motion.button key={idx} whileHover={{ x: 3 }} onClick={item.onClick}
              className={`w-full p-4 flex items-center justify-between transition ${idx < menuItems.length - 1 ? `border-b ${isDark ? 'border-[#3F3F46]' : 'border-[#E7E5E4]'}` : ''} ${isDark ? 'hover:bg-[#323238]' : 'hover:bg-[#F5F5F4]'}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#F97316]/10 flex items-center justify-center">{item.icon}</div>
                <div className="text-left">
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>{item.desc}</p>
                </div>
              </div>
              {item.badge && <span className="text-xs accent-gradient text-white px-2.5 py-0.5 rounded-lg font-bold">{item.badge}</span>}
            </motion.button>
          ))}
        </div>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleLogout}
          className={`w-full p-4 flex items-center space-x-3 rounded-2xl border transition ${isDark ? 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10' : 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'}`}
        >
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center"><FaSignOutAlt /></div>
          <span className="font-bold text-sm">Sign Out</span>
        </motion.button>

        <p className={`text-center text-[10px] font-medium pb-2 ${isDark ? 'text-[#3F3F46]' : 'text-[#D6D3D1]'}`}>Alliance v1.0.0</p>
      </div>
    </div>
  );
}
