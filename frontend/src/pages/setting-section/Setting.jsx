import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaBell, FaShieldAlt, FaPalette, FaSignOutAlt, FaChevronRight, FaChevronLeft, FaCamera, FaPen, FaCheck, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { IoMoon, IoSunny } from 'react-icons/io5';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStore } from '../../store/useThemeStore';
import { logoutUser, updateUserProfile, deleteUserAccount } from '../../services/user.service';
import { toast } from 'react-toastify';

const Setting = () => {
  const navigate = useNavigate();
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

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isDark = theme === 'dark';

  const handleLogout = async () => {
    try { await logoutUser(); } catch (_) {}
    clearUser();
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const res = await deleteUserAccount();
      if (res.status === 'success') {
        toast.success('Account permanently deleted');
        clearUser();
      } else {
        toast.error(res.message || 'Failed to delete account');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting account');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
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

  const fieldClass = `flex-1 p-1.5 bg-transparent border-b-2 border-[#F97316] focus:outline-none text-sm ${
    isDark ? 'text-[#FAFAFA]' : 'text-[#0C0A09]'
  }`;

  // Profile Editor View
  if (activeSection === 'profile') {
    return (
      <div className={`h-full flex flex-col select-none ${
        isDark ? 'bg-[#18181B] text-[#FAFAFA]' : 'bg-[#FAFAF9] text-[#0C0A09]'
      }`}>
        {/* Header */}
        <div className={`p-4 flex items-center gap-3 border-b ${
          isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'
        }`}>
          <button
            onClick={() => setActiveSection(null)}
            className={`p-1.5 rounded-xl ${isDark ? 'hover:bg-[#27272A]' : 'hover:bg-[#F5F5F4]'}`}
          >
            <FaChevronLeft size={16} />
          </button>
          <h2 className="text-lg font-extrabold">Edit Profile</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative w-28 h-28 group">
              <div className="w-full h-full rounded-2xl accent-gradient p-[3px]">
                <div className={`w-full h-full rounded-[13px] overflow-hidden ${isDark ? 'bg-[#09090B]' : 'bg-white'}`}>
                  <img
                    src={previewUrl || user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <label className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
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
                className="mt-3 px-5 py-1.5 accent-gradient text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50 hover:brightness-110"
              >
                {loading ? 'Uploading...' : 'Save Picture'}
              </motion.button>
            )}
          </div>

          {/* Username field */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#27272A] border-[#3F3F46]' : 'bg-white border-[#E7E5E4] shadow-sm'}`}>
            <label className="text-[10px] text-[#F97316] font-bold uppercase tracking-widest block mb-2">Your Name</label>
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
                    className="text-[#F97316] hover:brightness-110 disabled:opacity-50"
                  >
                    <FaCheck size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="font-bold text-sm">{user?.username || '—'}</span>
                  <button onClick={() => { setUsername(user?.username || ''); setIsEditingName(true); }} className={`${isDark ? 'text-[#71717A] hover:text-[#F97316]' : 'text-[#A8A29E] hover:text-[#F97316]'}`}>
                    <FaPen size={12} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* About field */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#27272A] border-[#3F3F46]' : 'bg-white border-[#E7E5E4] shadow-sm'}`}>
            <label className="text-[10px] text-[#F97316] font-bold uppercase tracking-widest block mb-2">About</label>
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
                    className="text-[#F97316] hover:brightness-110 disabled:opacity-50"
                  >
                    <FaCheck size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className={`font-medium text-sm ${isDark ? 'text-[#A1A1AA]' : 'text-[#78716C]'}`}>
                    {user?.about || 'Hey there! I am using Alliance.'}
                  </span>
                  <button onClick={() => { setAbout(user?.about || ''); setIsEditingAbout(true); }} className={`flex-shrink-0 ${isDark ? 'text-[#71717A] hover:text-[#F97316]' : 'text-[#A8A29E] hover:text-[#F97316]'}`}>
                    <FaPen size={12} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Read-only info */}
          {(user?.email || user?.phoneNumber) && (
            <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#27272A] border-[#3F3F46]' : 'bg-white border-[#E7E5E4] shadow-sm'}`}>
              <label className="text-[10px] text-[#F97316] font-bold uppercase tracking-widest block">Account Info</label>
              {user?.email && (
                <div>
                  <p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>Email</p>
                  <p className="font-bold text-sm">{user.email}</p>
                </div>
              )}
              {user?.phoneNumber && (
                <div>
                  <p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>Phone</p>
                  <p className="font-bold text-sm">{user.phoneSuffix}{user.phoneNumber}</p>
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
        isDark ? 'bg-[#18181B] text-[#FAFAFA]' : 'bg-[#FAFAF9] text-[#0C0A09]'
      }`}>
        <div className={`p-4 flex items-center gap-3 border-b ${isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'}`}>
          <button onClick={() => setActiveSection(null)} className={`p-1.5 rounded-xl ${isDark ? 'hover:bg-[#27272A]' : 'hover:bg-[#F5F5F4]'}`}>
            <FaChevronLeft size={16} />
          </button>
          <h2 className="text-lg font-extrabold">Notifications</h2>
        </div>
        <div className="flex-1 p-5 space-y-4">
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#27272A] border-[#3F3F46]' : 'bg-white border-[#E7E5E4] shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Message Notifications</p>
                <p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>Show notifications for new messages</p>
              </div>
              <div className="w-10 h-6 accent-gradient rounded-full relative cursor-pointer shadow-md shadow-orange-500/20">
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
        isDark ? 'bg-[#18181B] text-[#FAFAFA]' : 'bg-[#FAFAF9] text-[#0C0A09]'
      }`}>
        <div className={`p-4 flex items-center gap-3 border-b ${isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'}`}>
          <button onClick={() => setActiveSection(null)} className={`p-1.5 rounded-xl ${isDark ? 'hover:bg-[#27272A]' : 'hover:bg-[#F5F5F4]'}`}>
            <FaChevronLeft size={16} />
          </button>
          <h2 className="text-lg font-extrabold">Privacy</h2>
        </div>
        <div className="flex-1 p-5 space-y-4">
          {[
            { label: 'Last Seen', desc: 'Everyone', value: 'Everyone' },
            { label: 'Profile Photo', desc: 'Everyone', value: 'Everyone' },
            { label: 'Read Receipts', desc: 'Enabled', value: 'On' },
          ].map((item) => (
            <div key={item.label} className={`p-4 rounded-2xl border ${isDark ? 'bg-[#27272A] border-[#3F3F46]' : 'bg-white border-[#E7E5E4] shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{item.label}</p>
                  <p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>{item.desc}</p>
                </div>
                <span className="text-xs text-[#F97316] font-bold">{item.value}</span>
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
        ...(user?.role === 'admin' ? [{ id: 'admin', icon: FaShieldAlt, label: 'Admin Dashboard', desc: 'Manage user registrations & system details' }] : []),
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
      isDark ? 'bg-[#18181B] text-[#FAFAFA]' : 'bg-[#FAFAF9] text-[#0C0A09]'
    }`}>
      {/* Header */}
      <div className={`p-5 border-b ${isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'}`}>
        <h2 className="text-xl font-extrabold tracking-tight">Settings</h2>
      </div>

      {/* User profile card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={() => setActiveSection('profile')}
        className={`mx-4 mt-4 p-4 rounded-2xl flex items-center gap-4 border cursor-pointer transition-all ${
          isDark ? 'bg-[#27272A] border-[#3F3F46] hover:border-[#F97316]/30' : 'bg-white border-[#E7E5E4] hover:border-[#F97316]/30 shadow-sm'
        }`}
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl accent-gradient p-[2px]">
            <div className={`w-full h-full rounded-[12px] overflow-hidden ${isDark ? 'bg-[#09090B]' : 'bg-white'}`}>
              <img
                src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#18181B] rounded-full online-badge" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold truncate">{user?.username || 'User'}</h3>
          <p className={`text-xs truncate ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
            {user?.phoneNumber ? `${user.phoneSuffix || ''} ${user.phoneNumber}` : user?.email || ''}
          </p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
            {user?.about || 'Hey! I am using Alliance.'}
          </p>
        </div>
        <FaChevronRight className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`} />
      </motion.div>

      {/* Settings groups */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 px-1 ${
              isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'
            }`}>
              {group.title}
            </p>
            <div className={`rounded-2xl overflow-hidden border ${
              isDark ? 'bg-[#27272A] border-[#3F3F46]' : 'bg-white border-[#E7E5E4] shadow-sm'
            }`}>
              {group.items.map((item, idx) => {
                const Icon = item.icon;
                const isLast = idx === group.items.length - 1;

                if (item.id === 'theme') {
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-4 ${
                        isDark ? 'bg-[#27272A]' : 'bg-white'
                      }`}
                    >
                      <div className="w-9 h-9 bg-[#F97316]/10 rounded-xl flex items-center justify-center">
                        <Icon className="text-[#F97316] w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{item.label}</p>
                        <p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>{item.desc}</p>
                      </div>
                      {/* Toggle switch */}
                      <button
                        id="theme-toggle"
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                          isDark ? 'accent-gradient' : 'bg-[#E7E5E4]'
                        }`}
                      >
                        <motion.div
                          animate={{ x: isDark ? 28 : 4 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center"
                        >
                          {isDark ? <IoMoon className="text-[#F97316] w-3 h-3" /> : <IoSunny className="text-amber-500 w-3 h-3" />}
                        </motion.div>
                      </button>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 2 }}
                    onClick={() => {
                      if (item.id === 'admin') navigate('/admin');
                      else setActiveSection(item.id);
                    }}
                    className={`flex items-center gap-4 p-4 cursor-pointer ${
                      !isLast ? `border-b ${isDark ? 'border-[#3F3F46]' : 'border-[#E7E5E4]'}` : ''
                    } ${isDark ? 'hover:bg-[#323238]' : 'hover:bg-[#F5F5F4]'}`}
                  >
                    <div className="w-9 h-9 bg-[#F97316]/10 rounded-xl flex items-center justify-center">
                      <Icon className="text-[#F97316] w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>{item.desc}</p>
                    </div>
                    <FaChevronRight className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`} />
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
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition ${
            isDark
              ? 'border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10'
              : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
          }`}
        >
          <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <FaSignOutAlt className="w-4 h-4 text-amber-500" />
          </div>
          <span className="font-bold text-sm">Log Out</span>
        </motion.button>

        {/* Delete Account */}
        <motion.button
          id="delete-account-btn"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDeleteModal(true)}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition ${
            isDark
              ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'border-red-300 bg-red-100/70 text-red-600 hover:bg-red-200'
          }`}
        >
          <div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center">
            <FaTrash className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-left">
            <span className="font-bold text-sm block text-red-500">Delete Account</span>
            <span className={`text-[10px] ${isDark ? 'text-red-300/70' : 'text-red-700/70'}`}>
              Permanently delete profile and all chat history
            </span>
          </div>
        </motion.button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border ${
              isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-white border-[#E7E5E4] text-slate-900'
            }`}
          >
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-xl font-extrabold text-center mb-2">Delete Account Permanently?</h3>
            <p className={`text-xs text-center leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              This action <strong className="text-red-500">cannot be undone</strong>. All your personal profile data, conversation history, messages, and call records will be permanently erased from our servers.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className={`flex-1 py-3 text-xs font-bold rounded-2xl border transition ${
                  isDark ? 'border-[#27272A] hover:bg-[#27272A] text-slate-300' : 'border-[#E7E5E4] hover:bg-slate-100 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-3 text-xs font-bold rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <FaTrash className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Setting;
