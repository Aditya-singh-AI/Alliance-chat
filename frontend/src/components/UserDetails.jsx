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
    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleUpdateField = async (field, value) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append(field, value);
      const res = await updateUserProfile(formData);
      if (res.status === 'success') { setUser(res.data); toast.success('Profile updated'); setIsEditingName(false); setIsEditingAbout(false); }
    } catch { toast.error('Failed to update details'); }
    finally { setLoading(false); }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('media', selectedFile);
      const res = await updateUserProfile(formData);
      if (res.status === 'success') { setUser(res.data); toast.success('Profile picture updated'); setSelectedFile(null); setPreviewUrl(null); }
    } catch { toast.error('Failed to upload picture'); }
    finally { setLoading(false); }
  };

  const fieldClass = `flex-1 p-1.5 bg-transparent border-b-2 border-[#F97316] focus:outline-none ${isDark ? 'text-white' : 'text-gray-800'}`;

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-[#18181B] text-[#FAFAFA]' : 'bg-[#FAFAF9] text-[#0C0A09]'}`}>
      <div className={`p-4 flex items-center space-x-3 border-b ${isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'}`}>
        <button onClick={() => setActiveTab('settings')} className={`p-1.5 rounded-xl ${isDark ? 'hover:bg-[#27272A]' : 'hover:bg-[#F5F5F4]'}`}>
          <FaChevronLeft size={16} />
        </button>
        <h1 className="text-xl font-extrabold">Profile</h1>
      </div>

      <div className="flex-1 p-6 space-y-5 overflow-y-auto">
        <div className="flex flex-col items-center">
          <div className="relative w-28 h-28 group">
            <div className="w-full h-full rounded-2xl accent-gradient p-[3px]">
              <div className={`w-full h-full rounded-[13px] overflow-hidden ${isDark ? 'bg-[#09090B]' : 'bg-white'}`}>
                <img src={previewUrl || user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id}`}
                  alt="Avatar" className="w-full h-full object-cover"
                />
              </div>
            </div>
            <label className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
              <FaCamera className="text-white text-2xl" />
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
          {selectedFile && (
            <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} onClick={handleUploadImage} disabled={loading}
              className="mt-3 px-5 py-1.5 accent-gradient text-white text-xs font-bold rounded-xl hover:brightness-110 transition disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Save Picture'}
            </motion.button>
          )}
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#27272A] border-[#3F3F46]' : 'bg-white border-[#E7E5E4] shadow-sm'}`}>
          <label className="text-[10px] text-[#F97316] font-bold uppercase tracking-widest block mb-2">Your Name</label>
          <div className="flex items-center justify-between gap-2">
            {isEditingName ? (
              <>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={fieldClass} autoFocus />
                <button onClick={() => handleUpdateField('username', username)} disabled={loading} className="text-green-400 hover:text-green-300 disabled:opacity-50">
                  <FaCheck size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="font-bold text-sm">{user?.username || '—'}</span>
                <button onClick={() => setIsEditingName(true)} className={`${isDark ? 'text-[#71717A] hover:text-[#F97316]' : 'text-[#A8A29E] hover:text-[#F97316]'}`}>
                  <FaPen size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#27272A] border-[#3F3F46]' : 'bg-white border-[#E7E5E4] shadow-sm'}`}>
          <label className="text-[10px] text-[#F97316] font-bold uppercase tracking-widest block mb-2">About</label>
          <div className="flex items-center justify-between gap-2">
            {isEditingAbout ? (
              <>
                <input type="text" value={about} onChange={(e) => setAbout(e.target.value)} className={fieldClass} autoFocus />
                <button onClick={() => handleUpdateField('about', about)} disabled={loading} className="text-green-400 hover:text-green-300 disabled:opacity-50">
                  <FaCheck size={14} />
                </button>
              </>
            ) : (
              <>
                <span className={`font-medium text-sm ${isDark ? 'text-[#A1A1AA]' : 'text-[#78716C]'}`}>
                  {user?.about || 'Hey there! I am using Alliance.'}
                </span>
                <button onClick={() => setIsEditingAbout(true)} className={`flex-shrink-0 ${isDark ? 'text-[#71717A] hover:text-[#F97316]' : 'text-[#A8A29E] hover:text-[#F97316]'}`}>
                  <FaPen size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        {(user?.email || user?.phoneNumber) && (
          <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#27272A] border-[#3F3F46]' : 'bg-white border-[#E7E5E4] shadow-sm'}`}>
            <label className="text-[10px] text-[#F97316] font-bold uppercase tracking-widest block">Account Info</label>
            {user?.email && <div><p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>Email</p><p className="font-bold text-sm">{user.email}</p></div>}
            {user?.phoneNumber && <div><p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>Phone</p><p className="font-bold text-sm">{user.phoneSuffix}{user.phoneNumber}</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}
