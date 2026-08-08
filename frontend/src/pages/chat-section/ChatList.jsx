import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaSearch, FaTimes, FaUserPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../../store/useUserStore';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useSocketStore } from '../../store/useSocketStore';
import { getAllUsers } from '../../services/user.service';
import { formatTime } from '../../utils/formatTime';

const ChatList = () => {
  useUserStore();
  const { selectedContact, setSelectedContact } = useLayoutStore();
  const { theme } = useThemeStore();
  const { onlineUsers } = useSocketStore();

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
      } catch (err) { console.error('Failed to load contacts:', err); }
      finally { setLoading(false); }
    };
    fetchUsers();
  }, []);

  const filteredUsers = allUsers.filter((u) => u.username?.toLowerCase().includes(searchTerm.toLowerCase()));
  const modalFilteredUsers = allUsers.filter((u) => u.username?.toLowerCase().includes(modalSearchTerm.toLowerCase()));
  const handleSelectContact = (contact) => { setSelectedContact(contact); setShowNewChatModal(false); };

  return (
    <div className={`h-full flex flex-col select-none relative ${isDark ? 'bg-[#18181B] text-[#FAFAFA]' : 'bg-white text-[#0C0A09]'}`}>
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between`}>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Messages</h2>
          <p className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
            {allUsers.length} {allUsers.length === 1 ? 'contact' : 'contacts'}
          </p>
        </div>
        <motion.button id="new-chat-btn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setShowNewChatModal(true)}
          className="w-9 h-9 accent-gradient text-white rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-shadow"
          title="New Chat"
        >
          <FaPlus className="w-3 h-3" />
        </motion.button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <FaSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`} />
          <input id="chat-search" ref={searchInputRef} type="text" placeholder="Search conversations..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all border ${
              isDark ? 'bg-[#27272A] text-[#FAFAFA] placeholder-[#71717A] border-[#27272A] focus:border-[#F97316]/50' : 'bg-[#F5F5F4] text-[#0C0A09] placeholder-[#A8A29E] border-[#F5F5F4] focus:border-[#F97316]/50'
            }`}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-1 p-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-[#27272A]/50' : 'bg-[#F5F5F4]/50'}`}>
                <div className={`w-11 h-11 rounded-xl shimmer ${isDark ? 'bg-[#27272A]' : 'bg-[#E7E5E4]'}`} />
                <div className="flex-1">
                  <div className={`h-3.5 rounded-lg w-2/3 mb-2 shimmer ${isDark ? 'bg-[#27272A]' : 'bg-[#E7E5E4]'}`} />
                  <div className={`h-2.5 rounded-lg w-1/2 shimmer ${isDark ? 'bg-[#27272A]/60' : 'bg-[#E7E5E4]/60'}`} />
                </div>
              </div>
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
              const isSelected = selectedContact?._id === contact._id;
              const lastMsg = contact.conversation?.lastMessage;
              const unreadCount = contact.conversation?.unreadCount || 0;
              const isOnline = contact.isOnline || onlineUsers.has(contact._id);

              return (
                <motion.div key={contact._id} id={`contact-${contact._id}`} whileHover={{ x: 2 }}
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
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#18181B] rounded-full online-badge" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-bold text-[13px] truncate">{contact.username}</h3>
                      {lastMsg && (
                        <span className={`text-[10px] flex-shrink-0 ml-2 font-medium ${
                          isSelected ? 'text-[#F97316]' : isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'
                        }`}>
                          {formatTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs truncate pr-2 ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
                        {lastMsg ? lastMsg.content : contact.about || 'Available'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1.5 accent-gradient text-white text-[10px] font-bold rounded-md flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
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
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowNewChatModal(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border-2 flex flex-col max-h-[80vh] ${
                isDark ? 'bg-[#18181B] text-[#FAFAFA] border-[#27272A]' : 'bg-white text-[#0C0A09] border-[#E7E5E4]'
              }`}
            >
              <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 accent-gradient rounded-lg flex items-center justify-center">
                    <FaUserPlus className="text-white text-xs" />
                  </div>
                  <h3 className="font-extrabold text-sm">New Chat</h3>
                </div>
                <button onClick={() => setShowNewChatModal(false)}
                  className={`p-1.5 rounded-lg hover:bg-[#27272A] text-sm ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}
                >
                  <FaTimes />
                </button>
              </div>

              <div className={`p-3 border-b ${isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'}`}>
                <div className="relative">
                  <FaSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`} />
                  <input type="text" autoFocus placeholder="Search contacts..."
                    value={modalSearchTerm} onChange={(e) => setModalSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none border ${isDark ? 'bg-[#27272A] text-[#FAFAFA] placeholder-[#71717A] border-[#27272A]' : 'bg-[#F5F5F4] text-[#0C0A09] placeholder-[#A8A29E] border-[#F5F5F4]'}`}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {modalFilteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs opacity-60">No contacts found.</div>
                ) : (
                  modalFilteredUsers.map((user) => (
                    <div key={user._id} onClick={() => handleSelectContact(user)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isDark ? 'hover:bg-[#27272A]' : 'hover:bg-[#F5F5F4]'}`}
                    >
                      <img src={user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user._id}`}
                        alt={user.username} className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{user.username}</h4>
                        <p className={`text-xs truncate ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>{user.about || 'Available'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatList;
