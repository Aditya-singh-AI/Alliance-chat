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

  const [viewingStatus, setViewingStatus] = useState(null); // { stories, currentIdx, username, profilePicture }
  const [uploading, setUploading] = useState(false);
  const [allStatuses, setAllStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  // Fetch all statuses from API
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

  // Separate my statuses from others'
  const getUserIdStr = (u) => (u?._id || u?.id || u)?.toString() || "";
  const currentUserId = getUserIdStr(user);

  const myStatuses = allStatuses.filter(s => getUserIdStr(s.user) === currentUserId);
  const otherStatuses = allStatuses.filter(s => getUserIdStr(s.user) !== currentUserId);

  // Group other statuses by user
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

  // Upload status
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
        fetchStatuses(); // Refresh list
      }
    } catch (err) {
      console.error('Failed to upload status:', err);
      toast.error('Failed to upload status');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  // Text status upload
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

  // Delete my status
  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId);
      toast.success('Status deleted');
      fetchStatuses();
    } catch (err) {
      toast.error('Failed to delete status');
    }
  };

  // View a story (and mark it as viewed via API)
  const openStory = async (statusGroup) => {
    setViewingStatus({ stories: statusGroup.stories, currentIdx: 0, username: statusGroup.username, profilePicture: statusGroup.profilePicture });
    // Mark first story as viewed
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
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>

      {/* Header */}
      <div className={`p-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <h2 className="text-xl font-bold">Status</h2>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Stories disappear after 24 hours</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* My Status */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>My Status</p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-14 h-14 rounded-full border-2 overflow-hidden ${myStatuses.length > 0 ? 'border-[#00a884]' : 'border-dashed border-gray-400'}`}>
                <img
                  src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id}`}
                  alt="My status"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Upload button */}
              <label htmlFor="status-upload" className="absolute -bottom-1 -right-1 bg-[#00a884] text-white w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow hover:bg-[#008f6f] transition-colors">
                {uploading ? <Spinner size="sm" /> : <FaPlus className="text-xs" />}
              </label>
              <input id="status-upload" type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">My Status</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {myStatuses.length > 0 ? `${myStatuses.length} update${myStatuses.length > 1 ? 's' : ''}` : 'Tap + to add a status update'}
              </p>
            </div>
            {/* Text status button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTextInput(!showTextInput)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold ${isDark ? 'bg-[#202c33] text-[#00a884] hover:bg-[#2a3942]' : 'bg-[#00a884]/10 text-[#00a884] hover:bg-[#00a884]/20'}`}
            >
              Text
            </motion.button>
          </div>

          {/* Text status input */}
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
                    className={`flex-1 py-2 px-3 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-[#00a884]/40 ${isDark ? 'bg-[#202c33] border-[#2a3942] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`}
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleTextStatus}
                    disabled={uploading || !textContent.trim()}
                    className="px-4 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors"
                  >
                    Post
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* My status list (deletable) */}
          {myStatuses.length > 0 && (
            <div className="mt-3 space-y-2">
              {myStatuses.map((s) => (
                <div key={s._id} className={`flex items-center gap-3 p-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                    {s.contentType === 'image' ? (
                      <img src={s.content} alt="" className="w-full h-full object-cover" />
                    ) : s.contentType === 'video' ? (
                      <video src={s.content} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 p-1 truncate">{s.content}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{s.contentType === 'text' ? s.content : s.contentType}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <FaEye className="text-gray-500 text-[10px]" />
                      <span className="text-[10px] text-gray-500">{s.viewers?.length || 0} views</span>
                      <span className="text-[10px] text-gray-500">· {formatTime(s.createdAt)}</span>
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
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Recent Updates</p>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : otherUserGroups.length === 0 ? (
            <p className={`text-center text-sm py-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No recent updates</p>
          ) : (
            <div className="space-y-1">
              {otherUserGroups.map((statusGroup) => (
                <motion.div
                  key={statusGroup.userId}
                  whileHover={{ x: 3 }}
                  onClick={() => openStory(statusGroup)}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                >
                  {/* Ring avatar */}
                  <div className="w-14 h-14 rounded-full p-0.5 bg-[#00a884]">
                    <div className={`w-full h-full rounded-full overflow-hidden border-2 ${isDark ? 'border-gray-900' : 'border-white'}`}>
                      <img
                        src={statusGroup.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${statusGroup.userId}`}
                        alt={statusGroup.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{statusGroup.username}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {statusGroup.stories.length} update{statusGroup.stories.length > 1 ? 's' : ''} · {formatTime(statusGroup.stories[statusGroup.stories.length - 1]?.createdAt)}
                    </p>
                  </div>
                  <FaEye className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
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
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          >
            {/* Progress bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {viewingStatus.stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <div className={`h-full bg-white rounded-full transition-all duration-300 ${i < viewingStatus.currentIdx ? 'w-full' : i === viewingStatus.currentIdx ? 'w-full' : 'w-0'}`} />
                </div>
              ))}
            </div>

            {/* Close */}
            <button
              onClick={() => setViewingStatus(null)}
              className="absolute top-8 right-4 text-white z-10 p-2"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            {/* Username */}
            <div className="absolute top-10 left-4 flex items-center gap-3 z-10">
              <img
                src={viewingStatus.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewingStatus.username}`}
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-white/30"
              />
              <div>
                <p className="text-white font-semibold text-sm">{viewingStatus.username}</p>
                <p className="text-white/60 text-xs">{formatTime(viewingStatus.stories[viewingStatus.currentIdx]?.createdAt)}</p>
              </div>
            </div>

            {/* Story content */}
            {(() => {
              const currentStory = viewingStatus.stories[viewingStatus.currentIdx];
              if (!currentStory) return null;

              if (currentStory.contentType === 'video') {
                return <video src={currentStory.content} autoPlay controls className="max-h-screen max-w-full object-contain" />;
              } else if (currentStory.contentType === 'image') {
                return <img src={currentStory.content} alt="Story" className="max-h-screen max-w-full object-contain" />;
              } else {
                // Text status
                return (
                  <div className="flex items-center justify-center w-full h-full bg-[#111b21] p-10">
                    <p className="text-white text-2xl font-bold text-center max-w-md">{currentStory.content}</p>
                  </div>
                );
              }
            })()}

            {/* Caption for media statuses */}
            {viewingStatus.stories[viewingStatus.currentIdx]?.contentType !== 'text' && viewingStatus.stories[viewingStatus.currentIdx]?.caption && (
              <div className="absolute bottom-10 left-0 right-0 text-center px-8">
                <p className="text-white font-medium text-sm bg-black/40 rounded-xl px-4 py-2 inline-block">
                  {viewingStatus.stories[viewingStatus.currentIdx].caption}
                </p>
              </div>
            )}

            {/* Tap zones for prev/next */}
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
