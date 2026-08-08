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
  useUserStore();
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
  }, []);

  const filteredUsers = allUsers.filter((u) =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const modalFilteredUsers = allUsers.filter((u) =>
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
        isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'
      }`}>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold tracking-tight">Chats</h1>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold accent-gradient text-white">
            {allUsers.length}
          </span>
        </div>
        <motion.button
          id="new-chat-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNewChatModal(true)}
          className="p-2.5 accent-gradient text-white rounded-xl shadow-md shadow-orange-500/20"
          title="New Chat"
        >
          <FaPlus size={13} />
        </motion.button>
      </div>

      {/* Search Bar */}
      <div className="p-3">
        <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all ${
          isDark
            ? 'bg-[#18181B] border-[#27272A] focus-within:border-[#F97316]/50'
            : 'bg-white border-[#E7E5E4] focus-within:border-[#F97316]/50 shadow-sm'
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
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-[#18181B]' : 'bg-[#E7E5E4]'}`} />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <p className={`text-sm font-medium ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
              {searchTerm ? 'No matching contacts' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="px-2 space-y-0.5">
            {filteredUsers.map((contact) => {
              const contactIdStr = (contact._id || contact.id)?.toString();
              const isSelected = (selectedContact?._id || selectedContact?.id)?.toString() === contactIdStr;
              const lastMsg = contact.conversation?.lastMessage;
              const unreadCount = contact.conversation?.unreadCount || 0;
              const isOnline = checkIsOnline(contact);

              return (
                <motion.div key={contact._id || contact.id} id={`contact-${contact._id}`} whileHover={{ x: 2 }}
                  onClick={() => setSelectedContact(contact)}
                  className={`flex items-center gap-3 px-3 py-3 cursor-pointer rounded-xl transition-all ${
                    isSelected
                      ? isDark ? 'bg-[#F97316]/10 border border-[#F97316]/20' : 'bg-orange-50 border border-orange-200'
                      : isDark ? 'hover:bg-[#27272A]/70 border border-transparent' : 'hover:bg-[#F5F5F4] border border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img src={contact.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact._id}`}
                      alt={contact.username} className="w-11 h-11 rounded-xl object-cover"
                    />
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#09090B] rounded-full online-badge" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="font-bold text-sm truncate leading-none">{contact.username}</h3>
                      {lastMsg && (
                        <span className={`text-[10px] flex-shrink-0 ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
                          {formatTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${
                        unreadCount > 0 ? 'font-bold text-foreground' : isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'
                      }`}>
                        {lastMsg ? lastMsg.content || 'Media' : contact.about || 'Available'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold accent-gradient text-white rounded-full flex-shrink-0 min-w-[18px] text-center shadow-sm">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-2 ${
                isDark ? 'bg-[#18181B] border-[#27272A] text-[#FAFAFA]' : 'bg-white border-[#E7E5E4] text-[#0C0A09]'
              }`}
            >
              <div className="h-1.5 w-full accent-gradient" />
              <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'}`}>
                <div className="flex items-center gap-2">
                  <FaUserPlus className="text-[#F97316]" />
                  <h3 className="font-extrabold text-sm">New Conversation</h3>
                </div>
                <button onClick={() => setShowNewChatModal(false)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-[#27272A]' : 'hover:bg-gray-100'}`}>
                  <FaTimes />
                </button>
              </div>

              <div className="p-3">
                <input type="text" placeholder="Search by name or email..." value={modalSearchTerm} onChange={(e) => setModalSearchTerm(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-medium outline-none ${
                    isDark ? 'bg-[#27272A] border-[#3F3F46] text-white placeholder-[#71717A] focus:border-[#F97316]' : 'bg-[#F5F5F4] border-[#E7E5E4] text-black placeholder-[#A8A29E] focus:border-[#F97316]'
                  }`}
                />
              </div>

              <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                {modalFilteredUsers.map((u) => {
                  const isOnline = checkIsOnline(u);
                  return (
                    <div key={u._id} onClick={() => { setSelectedContact(u); setShowNewChatModal(false); }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${
                        isDark ? 'hover:bg-[#27272A]' : 'hover:bg-[#F5F5F4]'
                      }`}
                    >
                      <div className="relative">
                        <img src={u.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u._id}`} alt={u.username} className="w-9 h-9 rounded-xl object-cover" />
                        {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#18181B] rounded-full online-badge" />}
                      </div>
                      <div>
                        <p className="font-bold text-xs">{u.username}</p>
                        <p className={`text-[10px] ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>{u.email}</p>
                      </div>
                    </div>
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
