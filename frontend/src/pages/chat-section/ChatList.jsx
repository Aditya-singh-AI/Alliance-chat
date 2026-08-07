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
      } catch (err) {
        console.error('Failed to load contacts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = allUsers.filter((u) =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const modalFilteredUsers = allUsers.filter((u) =>
    u.username?.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  const handleOpenNewChat = () => {
    setShowNewChatModal(true);
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setShowNewChatModal(false);
  };

  return (
    <div className={`h-full flex flex-col select-none relative ${
      isDark ? 'bg-[#111b21] text-[#e9edef]' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3.5 flex items-center justify-between border-b ${
        isDark ? 'border-[#202c33]' : 'border-gray-100'
      }`}>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Chats</h2>
          <p className={`text-xs font-medium ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
            {allUsers.length} {allUsers.length === 1 ? 'contact' : 'contacts'}
          </p>
        </div>
        <motion.button
          id="new-chat-btn"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleOpenNewChat}
          className="p-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full shadow-md transition-all flex items-center justify-center"
          title="New Chat"
        >
          <FaPlus className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Search Bar */}
      <div className={`p-3 border-b ${isDark ? 'border-[#202c33]' : 'border-gray-100'}`}>
        <div className="relative flex items-center">
          <FaSearch className={`absolute left-3.5 text-sm ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`} />
          <input
            id="chat-search"
            ref={searchInputRef}
            type="text"
            placeholder="Search or start new chat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-colors ${
              isDark
                ? 'bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] focus:bg-[#2a3942]'
                : 'bg-[#f0f2f5] text-gray-900 placeholder-gray-500 focus:bg-gray-200/80'
            }`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 text-xs text-gray-400 hover:text-gray-200"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-[#202c33]' : 'bg-gray-200'}`} />
                <div className="flex-1">
                  <div className={`h-3.5 rounded w-2/3 mb-2 ${isDark ? 'bg-[#202c33]' : 'bg-gray-200'}`} />
                  <div className={`h-2.5 rounded w-1/2 ${isDark ? 'bg-[#18222d]' : 'bg-gray-100'}`} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <p className={`text-sm ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`}>
              {searchTerm ? 'No matching contacts found' : 'No contacts available'}
            </p>
          </div>
        ) : (
          filteredUsers.map((contact) => {
            const isSelected = selectedContact?._id === contact._id;
            const lastMsg = contact.conversation?.lastMessage;
            const unreadCount = contact.conversation?.unreadCount || 0;
            const isOnline = contact.isOnline || onlineUsers.has(contact._id);

            return (
              <motion.div
                key={contact._id}
                id={`contact-${contact._id}`}
                whileHover={{ x: 2 }}
                onClick={() => setSelectedContact(contact)}
                className={`flex items-center gap-3.5 px-4 py-3 cursor-pointer border-b transition-colors ${
                  isDark ? 'border-[#202c33]' : 'border-gray-100'
                } ${
                  isSelected
                    ? isDark
                      ? 'bg-[#2a3942]'
                      : 'bg-[#f0f2f5]'
                    : isDark
                      ? 'hover:bg-[#202c33]/70'
                      : 'hover:bg-gray-50'
                }`}
              >
                {/* Avatar with Online Dot */}
                <div className="relative flex-shrink-0">
                  <img
                    src={contact.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact._id}`}
                    alt={contact.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a884] border-2 border-[#111b21] rounded-full online-badge" />
                  )}
                </div>

                {/* Contact Name & Message Preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-sm truncate">{contact.username}</h3>
                    {lastMsg && (
                      <span className={`text-xs flex-shrink-0 ml-1 ${
                        isSelected
                          ? 'text-[#00a884]'
                          : isDark ? 'text-[#8696a0]' : 'text-gray-400'
                      }`}>
                        {formatTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate pr-2 ${
                      isDark ? 'text-[#8696a0]' : 'text-gray-500'
                    }`}>
                      {lastMsg ? lastMsg.content : contact.about || 'Available'}
                    </p>
                    {unreadCount > 0 && (
                      <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-[#00a884] text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* New Chat Modal Popup */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowNewChatModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-[80vh] ${
                isDark ? 'bg-[#111b21] text-[#e9edef] border-[#202c33]' : 'bg-white text-gray-900 border-gray-200'
              }`}
            >
              {/* Modal Header */}
              <div className={`p-4 flex items-center justify-between border-b ${
                isDark ? 'border-[#202c33]' : 'border-gray-100'
              }`}>
                <div className="flex items-center gap-2">
                  <FaUserPlus className="text-[#00a884]" />
                  <h3 className="font-bold text-base">New Conversation</h3>
                </div>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className={`p-1.5 rounded-full hover:bg-gray-500/20 text-sm ${
                    isDark ? 'text-[#8696a0]' : 'text-gray-500'
                  }`}
                >
                  <FaTimes />
                </button>
              </div>

              {/* Modal Search Input */}
              <div className={`p-3 border-b ${isDark ? 'border-[#202c33]' : 'border-gray-100'}`}>
                <div className="relative flex items-center">
                  <FaSearch className={`absolute left-3.5 text-sm ${isDark ? 'text-[#8696a0]' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search contact name..."
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none ${
                      isDark
                        ? 'bg-[#202c33] text-[#e9edef] placeholder-[#8696a0]'
                        : 'bg-[#f0f2f5] text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>

              {/* Contacts Selection List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {modalFilteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs opacity-60">
                    No contacts found.
                  </div>
                ) : (
                  modalFilteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleSelectContact(user)}
                      className={`flex items-center gap-3.5 p-3 rounded-xl cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-[#202c33]' : 'hover:bg-gray-100'
                      }`}
                    >
                      <img
                        src={user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user._id}`}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{user.username}</h4>
                        <p className={`text-xs truncate ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                          {user.about || 'Available'}
                        </p>
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
