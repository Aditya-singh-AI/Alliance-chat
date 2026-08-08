import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTimes, FaEye, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { useUserStore } from '../../store/useUserStore';
import { useThemeStore } from '../../store/useThemeStore';
import { formatTime } from '../../utils/formatTime';
import Spinner from '../../utils/Spinner';
import { getStatuses, createStatus, deleteStatus, viewStatus } from '../../services/status.service';

const Status = () => {
  const { user } = useUserStore();
  const { theme } = useThemeStore();

  const [viewingStatus, setViewingStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [allStatuses, setAllStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await getStatuses();
      if (res.data) {
        setAllStatuses(res.data);
      }
    } catch (err) {
      console.error('Failed to load statuses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const getUserIdStr = (u) => (u?._id || u?.id || u)?.toString() || "";
  const currentUserId = getUserIdStr(user);

  const myStatuses = allStatuses.filter(s => getUserIdStr(s.user) === currentUserId);
  const otherStatuses = allStatuses.filter(s => getUserIdStr(s.user) !== currentUserId);

  const groupedByUser = otherStatuses.reduce((acc, status) => {
    const userId = getUserIdStr(status.user);
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        username: status.user?.username || 'User',
        profilePicture: status.user?.profilePicture,
        stories: [],
      };
    }
    acc[userId].stories.push(status);
    return acc;
  }, {});
  const otherUserGroups = Object.values(groupedByUser);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('media', file);
      const res = await createStatus(formData);
      if (res.data) {
        toast.success('Status uploaded!');
        fetchStatuses();
      }
    } catch (err) {
      console.error('Failed to upload status:', err);
      toast.error('Failed to upload status');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const [showTextInput, setShowTextInput] = useState(false);
  const [textContent, setTextContent] = useState('');

  const handleTextStatus = async () => {
    if (!textContent.trim()) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('content', textContent);
      const res = await createStatus(formData);
      if (res.data) {
        toast.success('Status posted!');
        fetchStatuses();
        setTextContent('');
        setShowTextInput(false);
      }
    } catch (err) {
      toast.error('Failed to post status');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId);
      toast.success('Status deleted');
      fetchStatuses();
    } catch (err) {
      toast.error('Failed to delete status');
    }
  };

  const openStory = async (statusGroup) => {
    setViewingStatus({ stories: statusGroup.stories, currentIdx: 0, username: statusGroup.username, profilePicture: statusGroup.profilePicture });
    try {
      await viewStatus(statusGroup.stories[0]._id);
    } catch (_) {}
  };

  const nextStory = async () => {
    if (!viewingStatus) return;
    if (viewingStatus.currentIdx < viewingStatus.stories.length - 1) {
      const nextIdx = viewingStatus.currentIdx + 1;
      setViewingStatus((prev) => ({ ...prev, currentIdx: nextIdx }));
      try {
        await viewStatus(viewingStatus.stories[nextIdx]._id);
      } catch (_) {}
    } else {
      setViewingStatus(null);
    }
  };

  const prevStory = () => {
    if (!viewingStatus || viewingStatus.currentIdx === 0) return;
    setViewingStatus((prev) => ({ ...prev, currentIdx: prev.currentIdx - 1 }));
  };

  return (
    <div className={`h-full flex flex-col select-none ${isDark ? 'bg-[#18181B] text-[#FAFAFA]' : 'bg-[#FAFAF9] text-[#0C0A09]'}`}>

      {/* Header */}
      <div className={`p-5 border-b ${isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'}`}>
        <h2 className="text-xl font-extrabold tracking-tight">Status</h2>
        <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>Stories disappear after 24 hours</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* My Status */}
        <div className={`p-4 border-b ${isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>My Status</p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl accent-gradient p-[2px]">
                <div className={`w-[52px] h-[52px] rounded-[14px] overflow-hidden ${isDark ? 'bg-[#09090B]' : 'bg-white'}`}>
                  <img
                    src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id}`}
                    alt="My status"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <label htmlFor="status-upload" className="absolute -bottom-1 -right-1 accent-gradient text-white w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow hover:brightness-110 transition-transform">
                {uploading ? <Spinner size="sm" /> : <FaPlus className="text-xs" />}
              </label>
              <input id="status-upload" type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">My Status</p>
              <p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
                {myStatuses.length > 0 ? `${myStatuses.length} update${myStatuses.length > 1 ? 's' : ''}` : 'Tap + to add a status update'}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTextInput(!showTextInput)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${isDark ? 'bg-[#27272A] text-[#F97316] hover:bg-[#323238]' : 'bg-orange-50 text-[#F97316] hover:bg-orange-100'}`}
            >
              Text
            </motion.button>
          </div>

          <AnimatePresence>
            {showTextInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm border outline-none ${isDark ? 'bg-[#27272A] border-[#3F3F46] text-[#FAFAFA] placeholder-[#71717A] focus:border-[#F97316]' : 'bg-[#F5F5F4] border-[#E7E5E4] text-[#0C0A09] placeholder-[#A8A29E] focus:border-[#F97316]'}`}
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleTextStatus}
                    disabled={uploading || !textContent.trim()}
                    className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors shadow-md shadow-orange-500/20"
                  >
                    Post
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {myStatuses.length > 0 && (
            <div className="mt-3 space-y-2">
              {myStatuses.map((s) => (
                <div key={s._id} className={`flex items-center gap-3 p-2.5 rounded-2xl border ${isDark ? 'bg-[#27272A] border-[#3F3F46]' : 'bg-white border-[#E7E5E4] shadow-sm'}`}>
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
                    {s.contentType === 'image' ? (
                      <img src={s.content} alt="" className="w-full h-full object-cover" />
                    ) : s.contentType === 'video' ? (
                      <video src={s.content} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 p-1 truncate">{s.content}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{s.contentType === 'text' ? s.content : s.contentType}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <FaEye className="text-[#F97316] text-[10px]" />
                      <span className={`text-[10px] ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>{s.viewers?.length || 0} views</span>
                      <span className={`text-[10px] ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>· {formatTime(s.createdAt)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteStatus(s._id)} className="text-red-400 hover:text-red-300 p-1">
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Updates */}
        <div className="p-4">
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>Recent Updates</p>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : otherUserGroups.length === 0 ? (
            <p className={`text-center text-xs py-8 ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>No recent updates</p>
          ) : (
            <div className="space-y-1">
              {otherUserGroups.map((statusGroup) => (
                <motion.div
                  key={statusGroup.userId}
                  whileHover={{ x: 2 }}
                  onClick={() => openStory(statusGroup)}
                  className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer border transition ${isDark ? 'bg-[#27272A] border-[#3F3F46] hover:border-[#F97316]/30' : 'bg-white border-[#E7E5E4] hover:border-[#F97316]/30 shadow-sm'}`}
                >
                  <div className="w-14 h-14 rounded-2xl accent-gradient p-[2px]">
                    <div className={`w-[52px] h-[52px] rounded-[14px] overflow-hidden ${isDark ? 'bg-[#09090B]' : 'bg-white'}`}>
                      <img
                        src={statusGroup.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${statusGroup.userId}`}
                        alt={statusGroup.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{statusGroup.username}</p>
                    <p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
                      {statusGroup.stories.length} update{statusGroup.stories.length > 1 ? 's' : ''} · {formatTime(statusGroup.stories[statusGroup.stories.length - 1]?.createdAt)}
                    </p>
                  </div>
                  <FaEye className={`text-sm ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {viewingStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center backdrop-blur-md"
          >
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {viewingStatus.stories.map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className={`h-full accent-gradient rounded-full transition-all duration-300 ${i < viewingStatus.currentIdx ? 'w-full' : i === viewingStatus.currentIdx ? 'w-full' : 'w-0'}`} />
                </div>
              ))}
            </div>

            <button
              onClick={() => setViewingStatus(null)}
              className="absolute top-8 right-4 text-white z-10 p-2 hover:opacity-80"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            <div className="absolute top-10 left-4 flex items-center gap-3 z-10">
              <img
                src={viewingStatus.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewingStatus.username}`}
                alt=""
                className="w-9 h-9 rounded-xl object-cover border border-white/30"
              />
              <div>
                <p className="text-white font-bold text-sm">{viewingStatus.username}</p>
                <p className="text-white/60 text-xs">{formatTime(viewingStatus.stories[viewingStatus.currentIdx]?.createdAt)}</p>
              </div>
            </div>

            {(() => {
              const currentStory = viewingStatus.stories[viewingStatus.currentIdx];
              if (!currentStory) return null;

              if (currentStory.contentType === 'video') {
                return <video src={currentStory.content} autoPlay controls className="max-h-screen max-w-full object-contain" />;
              } else if (currentStory.contentType === 'image') {
                return <img src={currentStory.content} alt="Story" className="max-h-screen max-w-full object-contain" />;
              } else {
                return (
                  <div className="flex items-center justify-center w-full h-full bg-[#18181B] p-10">
                    <p className="text-white text-2xl font-extrabold text-center max-w-md">{currentStory.content}</p>
                  </div>
                );
              }
            })()}

            {viewingStatus.stories[viewingStatus.currentIdx]?.contentType !== 'text' && viewingStatus.stories[viewingStatus.currentIdx]?.caption && (
              <div className="absolute bottom-10 left-0 right-0 text-center px-8 z-10">
                <p className="text-white font-semibold text-sm bg-black/60 backdrop-blur-md rounded-2xl px-4 py-2 inline-block">
                  {viewingStatus.stories[viewingStatus.currentIdx].caption}
                </p>
              </div>
            )}

            <div className="absolute inset-0 flex">
              <div className="w-1/2 h-full cursor-pointer" onClick={prevStory} />
              <div className="w-1/2 h-full cursor-pointer" onClick={nextStory} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Status;
