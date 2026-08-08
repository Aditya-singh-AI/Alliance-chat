import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaEye, FaChevronLeft, FaPaperPlane, FaImage } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useUserStore } from '../store/useUserStore';
import { useThemeStore } from '../store/useThemeStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { getStatuses, createStatus, deleteStatus, viewStatus } from '../services/status.service';
import { formatTime } from '../utils/formatTime';
import StatusPreview from './StatusPreview';

export default function Status() {
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const { setActiveTab } = useLayoutStore();

  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [textStatus, setTextStatus] = useState('');
  const [statusImage, setStatusImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [activeStory, setActiveStory] = useState(null);
  const [viewersList, setViewersList] = useState([]);
  const [showViewers, setShowViewers] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => { fetchStatuses(); }, []);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const res = await getStatuses();
      if (res.status === 'success') setStatuses(res.data);
    } catch (err) {
      toast.error('Failed to load status updates');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setStatusImage(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleCreateStatus = async (e) => {
    e.preventDefault();
    if (!textStatus.trim() && !statusImage) return toast.error('Enter text or pick an image');
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('content', textStatus);
      if (statusImage) formData.append('media', statusImage);
      const res = await createStatus(formData);
      if (res.status === 'success') {
        toast.success('Status uploaded!');
        setTextStatus(''); setStatusImage(null); setImagePreview(null); setIsCreateOpen(false);
        fetchStatuses();
      }
    } catch { toast.error('Failed to create status'); }
    finally { setLoading(false); }
  };

  const handleDeleteStatus = async (statusId) => {
    if (!window.confirm('Delete this status?')) return;
    try {
      const res = await deleteStatus(statusId);
      if (res.status === 'success') { toast.success('Status deleted'); fetchStatuses(); }
    } catch { toast.error('Failed to delete status'); }
  };

  const handleOpenStory = async (story) => {
    setActiveStory(story);
    try {
      await viewStatus(story._id);
      if (story.user._id === user._id) setViewersList(story.viewers || []);
    } catch (err) { console.error(err); }
  };

  const getUserIdStr = (u) => (u?._id || u?.id || u)?.toString() || "";
  const currentUserId = getUserIdStr(user);

  const groupedStatuses = (statuses || []).reduce((acc, cur) => {
    const uid = getUserIdStr(cur?.user);
    if (!uid) return acc;
    if (!acc[uid]) acc[uid] = { user: cur.user, stories: [] };
    acc[uid].stories.push(cur);
    return acc;
  }, {});

  const myStatuses = groupedStatuses[currentUserId];
  const contactStatuses = Object.entries(groupedStatuses).filter(([id]) => id !== currentUserId);

  return (
    <div className={`h-full flex flex-col select-none ${isDark ? 'bg-[#18181B] text-[#FAFAFA]' : 'bg-[#FAFAF9] text-[#0C0A09]'}`}>

      {/* Header */}
      <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'}`}>
        <div className="flex items-center space-x-3">
          <button onClick={() => setActiveTab('chats')} className={`p-1.5 rounded-xl ${isDark ? 'hover:bg-[#27272A]' : 'hover:bg-[#F5F5F4]'}`}>
            <FaChevronLeft size={16} />
          </button>
          <h1 className="text-xl font-extrabold">Status</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreateOpen(true)}
          className="p-2.5 accent-gradient text-white rounded-xl shadow-md shadow-orange-500/20"
        >
          <FaPlus size={14} />
        </motion.button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* My Status */}
        <div>
          <h2 className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest mb-3">My Status</h2>
          {myStatuses ? (
            <div className="space-y-2">
              {myStatuses.stories.map((story) => (
                <div
                  key={story._id}
                  onClick={() => handleOpenStory(story)}
                  className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer border transition ${isDark ? 'bg-[#27272A] border-[#3F3F46] hover:border-[#F97316]/30' : 'bg-white border-[#E7E5E4] hover:border-[#F97316]/30 shadow-sm'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl accent-gradient p-[2px]">
                      <div className={`w-[#44px] h-[#44px] rounded-[10px] overflow-hidden ${isDark ? 'bg-[#09090B]' : 'bg-white'}`}>
                        <img
                          src={story.user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.user._id}`}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-sm truncate max-w-[150px]">{story.content || 'Image update'}</p>
                      <p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>{formatTime(story.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setViewersList(story.viewers || []); setShowViewers(true); }}
                      className={`p-2 rounded-xl ${isDark ? 'hover:bg-[#3F3F46]' : 'hover:bg-gray-100'}`}
                    >
                      <FaEye size={14} className={isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'} />
                    </button>
                    <button
                      onClick={() => handleDeleteStatus(story._id)}
                      className="p-2 rounded-xl hover:bg-red-500/10 text-red-400"
                    >
                      <FaTrash size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-xs italic ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>No status updates in the last 24 hours.</p>
          )}
        </div>

        {/* Contact Updates */}
        <div>
          <h2 className="text-[10px] font-bold text-[#F97316] uppercase tracking-widest mb-3">Recent Updates</h2>
          {contactStatuses.length === 0 ? (
            <p className={`text-xs italic ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>No updates from your contacts yet.</p>
          ) : (
            <div className="space-y-2">
              {contactStatuses.map(([id, item]) => {
                const latestStory = item.stories[item.stories.length - 1];
                return (
                  <motion.div
                    key={id}
                    whileHover={{ x: 2 }}
                    onClick={() => handleOpenStory(latestStory)}
                    className={`p-3 rounded-2xl flex items-center space-x-3 cursor-pointer border transition ${isDark ? 'bg-[#27272A] border-[#3F3F46] hover:border-[#F97316]/30' : 'bg-white border-[#E7E5E4] hover:border-[#F97316]/30 shadow-sm'}`}
                  >
                    <div className="w-12 h-12 rounded-xl accent-gradient p-[2px] flex-shrink-0">
                      <div className={`w-[#44px] h-[#44px] rounded-[10px] overflow-hidden ${isDark ? 'bg-[#09090B]' : 'bg-white'}`}>
                        <img
                          src={item.user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`}
                          alt={item.user.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.user.username}</p>
                      <p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
                        {item.stories.length} update{item.stories.length > 1 ? 's' : ''} · {formatTime(latestStory.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Status Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border-2 ${isDark ? 'bg-[#18181B] border-[#27272A] text-[#FAFAFA]' : 'bg-white border-[#E7E5E4] text-[#0C0A09]'}`}
            >
              <div className="h-1.5 w-full accent-gradient" />
              <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'}`}>
                <h3 className="text-lg font-extrabold">New Status</h3>
                <button onClick={() => { setIsCreateOpen(false); setImagePreview(null); setStatusImage(null); }} className={`text-lg p-1 rounded-lg ${isDark ? 'hover:bg-[#27272A]' : 'hover:bg-gray-100'}`}>✕</button>
              </div>
              <form onSubmit={handleCreateStatus} className="p-4 space-y-4">
                {imagePreview ? (
                  <div className="relative w-full h-48 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setStatusImage(null); }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-xl p-1.5 hover:bg-red-700 text-xs"
                    >✕</button>
                  </div>
                ) : (
                  <label className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition ${isDark ? 'border-[#3F3F46] hover:border-[#F97316]' : 'border-[#E7E5E4] hover:border-[#F97316]'}`}>
                    <FaImage size={28} className="text-[#F97316] mb-2" />
                    <span className={`text-xs font-semibold ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>Click to upload image</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
                <textarea
                  value={textStatus}
                  onChange={(e) => setTextStatus(e.target.value)}
                  placeholder="What's on your mind?"
                  rows="3"
                  className={`w-full p-3 rounded-xl border outline-none resize-none text-sm ${isDark ? 'bg-[#27272A] border-[#3F3F46] text-[#FAFAFA] placeholder-[#71717A] focus:border-[#F97316]' : 'bg-[#F5F5F4] border-[#E7E5E4] text-[#0C0A09] placeholder-[#A8A29E] focus:border-[#F97316]'}`}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 accent-gradient text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 hover:brightness-110 transition disabled:opacity-50"
                >
                  <FaPaperPlane size={13} />
                  <span>{loading ? 'Posting...' : 'Share Status'}</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer */}
      {activeStory && <StatusPreview story={activeStory} onClose={() => setActiveStory(null)} />}

      {/* Viewers Modal */}
      <AnimatePresence>
        {showViewers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={`w-full max-w-sm rounded-2xl p-4 shadow-xl border-2 ${isDark ? 'bg-[#18181B] border-[#27272A] text-[#FAFAFA]' : 'bg-white border-[#E7E5E4] text-[#0C0A09]'}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-extrabold">Views ({viewersList.length})</h3>
                <button onClick={() => setShowViewers(false)} className={`text-lg p-1 rounded-lg ${isDark ? 'hover:bg-[#27272A]' : 'hover:bg-gray-100'}`}>✕</button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-3">
                {viewersList.length === 0 ? (
                  <p className={`text-xs text-center italic ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>No views yet.</p>
                ) : viewersList.map((viewer) => (
                  <div key={viewer._id} className="flex items-center space-x-3">
                    <img
                      src={viewer.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewer._id}`}
                      alt={viewer.username}
                      className="w-9 h-9 rounded-xl object-cover"
                    />
                    <p className="font-bold text-sm">{viewer.username}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
