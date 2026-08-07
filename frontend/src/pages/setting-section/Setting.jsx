import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaBell, FaShieldAlt, FaPalette, FaSignOutAlt, FaChevronRight, FaChevronLeft, FaCamera, FaPen, FaCheck } from 'react-icons/fa';
import { IoMoon, IoSunny } from 'react-icons/io5';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStore } from '../../store/useThemeStore';
import { logoutUser, updateUserProfile } from '../../services/user.service';
import { toast } from 'react-toastify';

const Setting = () => {
  const { user, clearUser, setUser } = useUserStore();
  const { theme, setTheme } = useThemeStore();
  const [activeSection, setActiveSection] = useState(null); // null | 'profile' | 'notifications' | 'privacy'

  // Profile editing state
  const [username, setUsername] = useState(user?.username || '');
  const [about, setAbout] = useState(user?.about || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const isDark = theme === 'dark';

  const handleLogout = async () => {
    try { await logoutUser(); } catch (_) {}
    clearUser();
  };

  // Profile Update Handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateField = async (field, value) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append(field, value);
      const res = await updateUserProfile(formData);
      if (res.status === 'success') {
        setUser(res.data);
        toast.success('Profile updated');
        setIsEditingName(false);
        setIsEditingAbout(false);
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('media', selectedFile);
      const res = await updateUserProfile(formData);
      if (res.status === 'success') {
        setUser(res.data);
        toast.success('Profile picture updated');
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch {
      toast.error('Failed to upload picture');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = `flex-1 p-1.5 bg-transparent border-b-2 border-[#00a884] focus:outline-none text-sm ${
    isDark ? 'text-[#e9edef]' : 'text-gray-900'
  }`;

  // Profile Editor View
  if (activeSection === 'profile') {
    return (
      <div className={`h-full flex flex-col select-none ${
        isDark ? 'bg-[#111b21] text-[#e9edef]' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`p-4 flex items-center gap-3 border-b ${
          isDark ? 'border-[#202c33]' : 'border-gray-100'
        }`}>
          <button
            onClick={() => setActiveSection(null)}
            className={`p-1.5 rounded-full ${isDark ? 'hover:bg-[#202c33]' : 'hover:bg-gray-100'}`}
          >
            <FaChevronLeft size={16} />
          </button>
          <h2 className="text-lg font-bold">Edit Profile</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative w-28 h-28 group">
              <img
                src={previewUrl || user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id}`}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover border-4 border-[#00a884]"
              />
              <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <FaCamera className="text-white text-xl" />
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
            {selectedFile && (
              <motion.button
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleUploadImage}
                disabled={loading}
                className="mt-3 px-5 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold rounded-full shadow transition disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Save Picture'}
              </motion.button>
            )}
          </div>

          {/* Username field */}
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
            <label className="text-xs text-[#00a884] font-semibold block mb-2">Your Name</label>
            <div className="flex items-center justify-between gap-2">
              {isEditingName ? (
                <>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={fieldClass}
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdateField('username', username)}
                    disabled={loading}
                    className="text-[#00a884] hover:text-[#008f6f] disabled:opacity-50"
                  >
                    <FaCheck size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="font-medium text-sm">{user?.username || '—'}</span>
                  <button onClick={() => { setUsername(user?.username || ''); setIsEditingName(true); }} className="text-gray-400 hover:text-[#00a884]">
                    <FaPen size={12} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* About field */}
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
            <label className="text-xs text-[#00a884] font-semibold block mb-2">About</label>
            <div className="flex items-center justify-between gap-2">
              {isEditingAbout ? (
                <>
                  <input
                    type="text"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className={fieldClass}
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdateField('about', about)}
                    disabled={loading}
                    className="text-[#00a884] hover:text-[#008f6f] disabled:opacity-50"
                  >
                    <FaCheck size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className={`font-medium text-sm ${isDark ? 'text-[#8696a0]' : 'text-gray-700'}`}>
                    {user?.about || 'Hey there! I am using Talkative.'}
                  </span>
                  <button onClick={() => { setAbout(user?.about || ''); setIsEditingAbout(true); }} className="text-gray-400 hover:text-[#00a884] flex-shrink-0">
                    <FaPen size={12} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Read-only info */}
          {(user?.email || user?.phoneNumber) && (
            <div className={`p-4 rounded-2xl space-y-3 ${isDark ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
              <label className="text-xs text-[#00a884] font-semibold block">Account Info</label>
              {user?.email && (
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="font-medium text-sm">{user.email}</p>
                </div>
              )}
              {user?.phoneNumber && (
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="font-medium text-sm">{user.phoneSuffix}{user.phoneNumber}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Notifications Sub-view
  if (activeSection === 'notifications') {
    return (
      <div className={`h-full flex flex-col select-none ${
        isDark ? 'bg-[#111b21] text-[#e9edef]' : 'bg-white text-gray-900'
      }`}>
        <div className={`p-4 flex items-center gap-3 border-b ${isDark ? 'border-[#202c33]' : 'border-gray-100'}`}>
          <button onClick={() => setActiveSection(null)} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-[#202c33]' : 'hover:bg-gray-100'}`}>
            <FaChevronLeft size={16} />
          </button>
          <h2 className="text-lg font-bold">Notifications</h2>
        </div>
        <div className="flex-1 p-5 space-y-4">
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Message Notifications</p>
                <p className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>Show notifications for new messages</p>
              </div>
              <div className="w-10 h-6 bg-[#00a884] rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Privacy Sub-view
  if (activeSection === 'privacy') {
    return (
      <div className={`h-full flex flex-col select-none ${
        isDark ? 'bg-[#111b21] text-[#e9edef]' : 'bg-white text-gray-900'
      }`}>
        <div className={`p-4 flex items-center gap-3 border-b ${isDark ? 'border-[#202c33]' : 'border-gray-100'}`}>
          <button onClick={() => setActiveSection(null)} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-[#202c33]' : 'hover:bg-gray-100'}`}>
            <FaChevronLeft size={16} />
          </button>
          <h2 className="text-lg font-bold">Privacy</h2>
        </div>
        <div className="flex-1 p-5 space-y-4">
          {[
            { label: 'Last Seen', desc: 'Everyone', value: 'Everyone' },
            { label: 'Profile Photo', desc: 'Everyone', value: 'Everyone' },
            { label: 'Read Receipts', desc: 'Enabled', value: 'On' },
          ].map((item) => (
            <div key={item.label} className={`p-4 rounded-2xl ${isDark ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>{item.desc}</p>
                </div>
                <span className="text-xs text-[#00a884] font-semibold">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Main Settings View
  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { id: 'profile', icon: FaUser, label: 'Profile', desc: 'Name, photo, about' },
        { id: 'notifications', icon: FaBell, label: 'Notifications', desc: 'Message & call tones' },
        { id: 'privacy', icon: FaShieldAlt, label: 'Privacy', desc: 'Last seen, status, read receipts' },
      ],
    },
    {
      title: 'Appearance',
      items: [
        { id: 'theme', icon: FaPalette, label: 'Theme', desc: isDark ? 'Dark mode' : 'Light mode' },
      ],
    },
  ];

  return (
    <div className={`h-full flex flex-col select-none ${
      isDark ? 'bg-[#111b21] text-[#e9edef]' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className={`p-5 border-b ${isDark ? 'border-[#202c33]' : 'border-gray-100'}`}>
        <h2 className="text-xl font-bold tracking-tight">Settings</h2>
      </div>

      {/* User profile card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={() => setActiveSection('profile')}
        className={`mx-4 mt-4 p-4 rounded-2xl flex items-center gap-4 border cursor-pointer ${
          isDark ? 'bg-[#202c33] border-[#202c33] hover:bg-[#2a3942]' : 'bg-[#f0f2f5] border-gray-200 hover:bg-gray-200/80'
        }`}
      >
        <div className="relative">
          <img
            src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id}`}
            alt="Profile"
            className="w-14 h-14 rounded-full object-cover border-2 border-[#00a884]"
          />
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a884] border-2 border-[#111b21] rounded-full online-badge" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold truncate">{user?.username || 'User'}</h3>
          <p className={`text-xs truncate ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
            {user?.phoneNumber ? `${user.phoneSuffix || ''} ${user.phoneNumber}` : user?.email || ''}
          </p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`}>
            {user?.about || 'Hey! I am using Talkative.'}
          </p>
        </div>
        <FaChevronRight className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`} />
      </motion.div>

      {/* Settings groups */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2 px-1 ${
              isDark ? 'text-[#8696a0]' : 'text-gray-400'
            }`}>
              {group.title}
            </p>
            <div className={`rounded-2xl overflow-hidden border ${
              isDark ? 'border-[#202c33]' : 'border-gray-100'
            }`}>
              {group.items.map((item, idx) => {
                const Icon = item.icon;
                const isLast = idx === group.items.length - 1;

                if (item.id === 'theme') {
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-4 ${
                        isDark ? 'bg-[#202c33]' : 'bg-gray-50'
                      }`}
                    >
                      <div className="w-9 h-9 bg-[#00a884]/20 rounded-xl flex items-center justify-center">
                        <Icon className="text-[#00a884] w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>{item.desc}</p>
                      </div>
                      {/* Toggle switch */}
                      <button
                        id="theme-toggle"
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                          isDark ? 'bg-[#00a884]' : 'bg-gray-300'
                        }`}
                      >
                        <motion.div
                          animate={{ x: isDark ? 28 : 4 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center"
                        >
                          {isDark ? <IoMoon className="text-[#00a884] w-3 h-3" /> : <IoSunny className="text-yellow-500 w-3 h-3" />}
                        </motion.div>
                      </button>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 2 }}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-4 p-4 cursor-pointer ${
                      !isLast ? `border-b ${isDark ? 'border-[#18222d]' : 'border-gray-100'}` : ''
                    } ${isDark ? 'bg-[#202c33] hover:bg-[#2a3942]' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className="w-9 h-9 bg-[#00a884]/20 rounded-xl flex items-center justify-center">
                      <Icon className="text-[#00a884] w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>{item.desc}</p>
                    </div>
                    <FaChevronRight className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout */}
        <motion.button
          id="logout-btn"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
        >
          <div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center">
            <FaSignOutAlt className="w-4 h-4 text-red-500" />
          </div>
          <span className="font-medium text-sm">Log Out</span>
        </motion.button>
      </div>
    </div>
  );
};

export default Setting;
