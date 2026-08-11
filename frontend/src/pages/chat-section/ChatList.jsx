import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaSearch, FaTimes, FaUserPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../../store/useUserStore';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useSocketStore } from '../../store/useSocketStore';
import { useChatStore } from '../../store/useChatStore';
import { getAllUsers } from '../../services/user.service';
import { formatTime } from '../../utils/formatTime';

const ChatList = () => {
  const { user } = useUserStore();
  const { selectedContact, setSelectedContact } = useLayoutStore();
  const { theme } = useThemeStore();
  useSocketStore((state) => state.onlineUsers);
  const { isUserOnline } = useChatStore();

  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');

  const searchInputRef = useRef(null);
  const isDark = theme === 'dark';
  const currentUserId = (user?._id || user?.id)?.toString();

  const conversations = useChatStore((state) => state.conversations);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getAllUsers();
        if (res.status === 'success') setAllUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [conversations]);

  // Exclude current logged in user from all lists
  const otherUsers = allUsers.filter((u) => {
    const uid = (u._id || u.id)?.toString();
    return uid && uid !== currentUserId;
  });

  // Main Chat List: only show users with active conversations OR currently selected contact
  const mainListUsers = otherUsers
    .filter((u) => {
      const isSelected = selectedContact && (selectedContact._id || selectedContact.id)?.toString() === (u._id || u.id)?.toString();
      return u.conversation !== null || isSelected;
    })
    .sort((a, b) => {
      const dateA = a.conversation?.lastMessage?.createdAt || a.conversation?.updatedAt || 0;
      const dateB = b.conversation?.lastMessage?.createdAt || b.conversation?.updatedAt || 0;
      return new Date(dateB) - new Date(dateA);
    });

  const filteredUsers = mainListUsers.filter((u) =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const modalFilteredUsers = otherUsers.filter((u) =>
    u.username?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  const checkIsOnline = (contact) => {
    const contactIdStr = (contact?._id || contact?.id)?.toString();
    if (!contactIdStr) return false;
    return isUserOnline(contactIdStr);
  };

  return (
    <div className={`h-full flex flex-col select-none ${
      isDark ? 'bg-[#09090B] text-[#FAFAFA]' : 'bg-[#FAFAF9] text-[#0C0A09]'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between ${
        isDark ? 'border-[#27272A]/80' : 'border-[#E7E5E4]'
      }`}>
        <div className="flex items-center gap-2.5">
          <img src="/logo-orange.jpg" alt="Alliance Logo" className="w-8 h-8 rounded-xl object-cover shadow-sm" />
          <h1 className="text-xl font-extrabold tracking-tight accent-gradient-text">Alliance</h1>
        </div>
        <motion.button
          id="new-chat-btn"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setShowNewChatModal(true)}
          className="p-2.5 accent-gradient text-white rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center"
          title="New Chat"
        >
          <FaPlus size={13} />
        </motion.button>
      </div>

      {/* Search Bar */}
      <div className="px-3.5 py-3">
        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-200 ${
          isDark
            ? 'bg-[#18181B] border-[#27272A] focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/20'
            : 'bg-white border-[#E7E5E4] focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/20 shadow-sm'
        }`}>
          <FaSearch className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full bg-transparent text-xs font-medium outline-none ${
              isDark ? 'placeholder-[#71717A]' : 'placeholder-[#A8A29E]'
            }`}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-xs text-[#71717A] hover:text-[#FAFAFA]">
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Chat / User List */}
      <div className="flex-1 overflow-y-auto px-2.5">
        {loading ? (
          <div className="p-2 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-16 rounded-2xl animate-pulse ${isDark ? 'bg-[#18181B]' : 'bg-[#E7E5E4]'}`} />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <p className={`text-sm font-medium ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
              {searchTerm ? 'No matching contacts' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="py-1 space-y-1">
            {filteredUsers.map((contact, index) => {
              const contactIdStr = (contact._id || contact.id)?.toString();
              const isSelected = (selectedContact?._id || selectedContact?.id)?.toString() === contactIdStr;
              const lastMsg = contact.conversation?.lastMessage;
              const lastMsgSenderId = (lastMsg?.sender?._id || lastMsg?.sender?.id || lastMsg?.sender)?.toString();
              const unreadCount = (lastMsgSenderId === currentUserId) ? 0 : (contact.conversation?.unreadCount || 0);
              const isOnline = checkIsOnline(contact);
              const isLast = index === filteredUsers.length - 1;

              return (
                <div key={contact._id || contact.id} className="relative">
                  <motion.div
                    id={`contact-${contact._id}`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedContact(contact)}
                    className={`relative flex items-center gap-3.5 px-3.5 py-3 cursor-pointer rounded-2xl transition-all duration-200 ${
                      isSelected
                        ? isDark
                          ? 'bg-[#F97316]/15 border border-[#F97316]/40 shadow-lg shadow-orange-500/10 text-white'
                          : 'bg-orange-50/90 border border-orange-200 shadow-md shadow-orange-500/5 text-orange-950'
                        : isDark
                          ? 'hover:bg-[#1C1C20] border border-transparent text-[#FAFAFA]'
                          : 'hover:bg-[#F4F4F5] border border-transparent text-[#0C0A09]'
                    }`}
                  >
                    {/* Active Left Pill Strip */}
                    {isSelected && (
                      <div className="absolute left-1 top-2.5 bottom-2.5 w-1.5 accent-gradient rounded-full shadow-sm" />
                    )}

                    {/* Avatar with Smooth Rounded Corner */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={contact.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact._id}`}
                        alt={contact.username}
                        className={`w-12 h-12 rounded-2xl object-cover shadow-sm transition-all duration-200 border ${
                          isDark ? 'border-white/10' : 'border-black/5'
                        }`}
                      />
                      {isOnline && (
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 rounded-full online-badge ${
                          isDark ? 'border-[#09090B]' : 'border-white'
                        }`} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h3 className={`font-bold text-sm truncate leading-tight ${
                          isSelected ? 'text-[#F97316]' : ''
                        }`}>
                          {contact.username}
                        </h3>
                        {lastMsg && (
                          <span className={`text-[10px] flex-shrink-0 font-semibold ${
                            isSelected
                              ? 'text-[#F97316]'
                              : isDark
                                ? 'text-[#71717A]'
                                : 'text-[#A8A29E]'
                          }`}>
                            {formatTime(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${
                          unreadCount > 0
                            ? 'font-bold text-[#F97316]'
                            : isDark
                              ? 'text-[#A1A1AA]'
                              : 'text-[#71717A]'
                        }`}>
                          {lastMsg ? lastMsg.content || 'Media' : contact.about || 'Available'}
                        </p>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold accent-gradient text-white rounded-full flex-shrink-0 min-w-[20px] text-center shadow-md shadow-orange-500/30">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* WhatsApp style smooth rounded border divider */}
                  {!isLast && !isSelected && (
                    <div
                      className={`ml-[62px] mr-3 my-0.5 h-[1px] rounded-full transition-colors ${
                        isDark ? 'bg-[#27272A]/70' : 'bg-[#E7E5E4]'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div initial={{ scale: 0.92, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 15 }}
              className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border-2 ${
                isDark ? 'bg-[#18181B] border-[#27272A] text-[#FAFAFA]' : 'bg-white border-[#E7E5E4] text-[#0C0A09]'
              }`}
            >
              <div className="h-1.5 w-full accent-gradient" />
              <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'}`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#F97316]/10 text-[#F97316]">
                    <FaUserPlus />
                  </div>
                  <h3 className="font-extrabold text-sm">New Conversation</h3>
                </div>
                <button onClick={() => setShowNewChatModal(false)} className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-[#27272A] text-[#A1A1AA]' : 'hover:bg-gray-100 text-[#71717A]'}`}>
                  <FaTimes />
                </button>
              </div>

              <div className="p-3.5">
                <input type="text" placeholder="Search by name or email..." value={modalSearchTerm} onChange={(e) => setModalSearchTerm(e.target.value)}
                  className={`w-full p-3 rounded-2xl border text-xs font-medium outline-none transition-all ${
                    isDark ? 'bg-[#27272A] border-[#3F3F46] text-white placeholder-[#71717A] focus:border-[#F97316]' : 'bg-[#F5F5F4] border-[#E7E5E4] text-black placeholder-[#A8A29E] focus:border-[#F97316]'
                  }`}
                />
              </div>

              <div className="max-h-64 overflow-y-auto px-3 pb-3">
                {modalFilteredUsers.map((u, idx) => {
                  const isOnline = checkIsOnline(u);
                  const isLast = idx === modalFilteredUsers.length - 1;
                  return (
                    <React.Fragment key={u._id || u.id || idx}>
                      <div onClick={() => { setSelectedContact(u); setShowNewChatModal(false); }}
                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition ${
                          isDark ? 'hover:bg-[#27272A]' : 'hover:bg-[#F5F5F4]'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <img src={u.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u._id}`} alt={u.username} className="w-10 h-10 rounded-2xl object-cover shadow-sm" />
                          {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#18181B] rounded-full online-badge" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs truncate">{u.username}</p>
                          <p className={`text-[10px] truncate ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>{u.email}</p>
                        </div>
                      </div>
                      {!isLast && (
                        <div className={`ml-14 mr-2 h-[1px] rounded-full my-0.5 ${isDark ? 'bg-[#27272A]/60' : 'bg-[#E7E5E4]'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatList;
