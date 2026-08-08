import React, { useState } from 'react';
import { FaCamera, FaChevronLeft, FaCheck, FaPen } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useUserStore } from '../store/useUserStore';
import { useThemeStore } from '../store/useThemeStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { updateUserProfile } from '../services/user.service';
import { toast } from 'react-toastify';

export default function UserDetails() {
  const { user, setUser } = useUserStore();
  const { theme } = useThemeStore();
  const { setActiveTab } = useLayoutStore();

  const [username, setUsername] = useState(user?.username || '');
  const [about, setAbout] = useState(user?.about || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const isDark = theme === 'dark';

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
      toast.error('Failed to update details');
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

  const fieldClass = `flex-1 p-1 bg-transparent border-b-2 border-[#00a884] focus:outline-none ${isDark ? 'text-white' : 'text-gray-800'}`;

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-[#111b21] text-white' : 'bg-gray-100 text-gray-800'}`}>

      {/* Header */}
      <div className={`p-4 flex items-center space-x-3 border-b ${isDark ? 'bg-[#202c33] border-gray-700' : 'bg-white border-gray-200'}`}>
        <button
          onClick={() => setActiveTab('settings')}
          className={`p-1 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <FaChevronLeft size={18} />
        </button>
        <h1 className="text-xl font-bold">Profile Details</h1>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 group">
            <img
              src={previewUrl || user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id}`}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover border-4 border-[#00a884]"
            />
            <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
              <FaCamera className="text-white text-2xl" />
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
          {selectedFile && (
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleUploadImage}
              disabled={loading}
              className="mt-3 px-5 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold rounded-full transition disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Save Picture'}
            </motion.button>
          )}
        </div>

        {/* Username field */}
        <div className={`p-4 rounded-2xl shadow-sm ${isDark ? 'bg-[#202c33]' : 'bg-white'}`}>
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
                  className="text-green-400 hover:text-green-300 disabled:opacity-50"
                >
                  <FaCheck size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="font-medium">{user?.username || '—'}</span>
                <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-[#00a884]">
                  <FaPen size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* About field */}
        <div className={`p-4 rounded-2xl shadow-sm ${isDark ? 'bg-[#202c33]' : 'bg-white'}`}>
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
                  className="text-green-400 hover:text-green-300 disabled:opacity-50"
                >
                  <FaCheck size={14} />
                </button>
              </>
            ) : (
              <>
                <span className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {user?.about || 'Hey there! I am using Talkative.'}
                </span>
                <button onClick={() => setIsEditingAbout(true)} className="text-gray-400 hover:text-[#00a884] flex-shrink-0">
                  <FaPen size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Read-only info */}
        {(user?.email || user?.phoneNumber) && (
          <div className={`p-4 rounded-2xl shadow-sm space-y-3 ${isDark ? 'bg-[#202c33]' : 'bg-white'}`}>
            <label className="text-xs text-[#00a884] font-semibold block">Account Info</label>
            {user?.email && (
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-sm">{user.email}</p>
              </div>
            )}
            {user?.phoneNumber && (
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-medium text-sm">{user.phoneSuffix}{user.phoneNumber}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
