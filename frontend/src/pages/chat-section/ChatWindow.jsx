import React, { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { isToday, isYesterday, format } from "date-fns";
import { IoSend, IoAttach, IoHappyOutline, IoArrowBack, IoLockClosed, IoClose, IoPerson, IoInformationCircleOutline } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../../store/useChatStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import MessageBubble from "./MessageBubble";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const ChatWindow = ({ selectedContact: propSelectedContact, setSelectedContact: propSetSelectedContact }) => {
  const { selectedContact: storeSelectedContact, setSelectedContact: storeSetSelectedContact } = useLayoutStore();
  const selectedContact = propSelectedContact || storeSelectedContact;
  const setSelectedContact = propSetSelectedContact || storeSetSelectedContact;

  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);

  // Refs
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  const theme = useThemeStore((state) => state.theme);
  const currentUser = useChatStore((state) => state.currentUser);

  // Zustand States & Actions
  const {
    messages,
    loading,
    sendMessage,
    fetchMessages,
    conversations,
    startTyping,
    stopTyping,
    isUserTyping,
    isUserOnline,
    getUserLastSeen,
  } = useChatStore();

  // Outside click handlers to dismiss menus
  useOutsideClick(emojiPickerRef, () => setShowEmojiPicker(false));

  // Determine online/typing stats of receiver contact
  const contactId = selectedContact?._id || selectedContact?.id;
  const isOnline = isUserOnline(contactId) || Boolean(selectedContact?.isOnline);
  const lastSeen = getUserLastSeen(contactId) || selectedContact?.lastSeen;
  const currentConversation = useChatStore.getState().currentConversation;
  const isTyping = isUserTyping(contactId, currentConversation);

  // Scroll smoothly to screen bottom
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat messages when a new contact is clicked
  useEffect(() => {
    if (selectedContact) {
      const convId = selectedContact.conversation?._id || selectedContact.conversation?.id;
      if (convId) {
        fetchMessages(convId);
      } else if (conversations?.data?.length > 0) {
        const conversation = conversations.data.find((conv) =>
          conv.participants &&
          conv.participants.some((p) => (p._id || p.id) === contactId)
        );
        if (conversation) {
          fetchMessages(conversation._id || conversation.id);
        }
      }
    }
  }, [selectedContact, conversations, fetchMessages, contactId]);

  // Handle typing trigger on input change
  useEffect(() => {
    if (message.trim() && selectedContact) {
      startTyping(contactId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(contactId);
      }, 2000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, selectedContact, startTyping, stopTyping, contactId]);

  // File selection logic
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  // Deliver outbound messages
  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) return;

    const formData = new FormData();
    formData.append("senderId", currentUser?._id || currentUser?.id);
    formData.append("receiverId", contactId);
    formData.append("messageStatus", isOnline ? "delivered" : "sent");

    if (message.trim()) {
      formData.append("content", message.trim());
    }
    if (selectedFile) {
      formData.append("media", selectedFile);
    }

    setMessage("");
    setSelectedFile(null);
    setFilePreview(null);
    setShowFileMenu(false);

    try {
      await sendMessage(formData);
    } catch (err) {
      console.error("Failed to deliver message:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Group messages chronologically with dividers
  const renderDateSeparator = (dateString) => {
    const date = new Date(dateString);
    let day = "";
    if (isToday(date)) day = "Today";
    else if (isYesterday(date)) day = "Yesterday";
    else day = format(date, "dd MMM yyyy");

    return (
      <div className="flex justify-center my-3">
        <span className={`px-3 py-1 rounded-lg text-[11px] font-medium shadow-sm ${
          theme === "dark"
            ? "bg-[#18222d] text-[#8696a0] border border-[#202c33]"
            : "bg-white text-gray-600 border border-gray-200"
        }`}>
          {day}
        </span>
      </div>
    );
  };

  // Empty placeholder view when no contact is selected
  if (!selectedContact) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 select-none ${
        theme === "dark" ? "bg-[#111b21] text-[#e9edef]" : "bg-[#f0f2f5] text-gray-800"
      }`}>
        <div className="w-48 h-48 mb-6 flex items-center justify-center rounded-full bg-[#00a884]/10">
          <svg className="w-24 h-24 text-[#00a884] opacity-80" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Talkative Messaging</h2>
        <p className={`text-xs max-w-sm mb-6 ${theme === "dark" ? "text-[#8696a0]" : "text-gray-500"}`}>
          Send and receive real-time messages instantly. Select any contact from the left list to begin.
        </p>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${theme === "dark" ? "text-[#8696a0]" : "text-gray-400"}`}>
          <IoLockClosed className="w-3.5 h-3.5" />
          End-to-end encrypted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-screen overflow-hidden ${
      theme === "dark" ? "bg-[#0b141a]" : "bg-[#efeae2]"
    }`}>
      {/* Header Bar — Click on Avatar or Name opens User Profile */}
      <div className={`px-4 py-2.5 flex items-center justify-between shadow-sm z-10 border-b ${
        theme === "dark" ? "bg-[#202c33] border-[#202c33] text-[#e9edef]" : "bg-[#f0f2f5] border-gray-200 text-gray-900"
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedContact(null)}
            className="md:hidden text-lg p-1 rounded-full hover:bg-gray-500/20"
          >
            <IoArrowBack />
          </button>
          
          {/* Contact Avatar & Info (Clickable for Profile View) */}
          <div
            onClick={() => setShowUserProfileModal(true)}
            className="flex items-center gap-3 cursor-pointer group"
            title="View Profile Details"
          >
            <div className="relative">
              <img
                src={selectedContact.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contactId}`}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover group-hover:opacity-90 transition-opacity"
              />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-[#202c33] rounded-full online-badge" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-sm leading-tight group-hover:text-[#00a884] transition-colors flex items-center gap-1.5">
                {selectedContact.username}
                <IoInformationCircleOutline className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
              </h4>
              <span className="text-[11px]">
                {isTyping ? (
                  <span className="text-[#00a884] font-semibold">typing...</span>
                ) : isOnline ? (
                  <span className="text-[#00a884]">online</span>
                ) : lastSeen ? (
                  <span className={theme === "dark" ? "text-[#8696a0]" : "text-gray-500"}>
                    last seen at {format(new Date(lastSeen), "HH:mm")}
                  </span>
                ) : (
                  <span className={theme === "dark" ? "text-[#8696a0]" : "text-gray-500"}>offline</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Messages Scroll Area with Pattern Background */}
      <div className={`flex-1 p-4 overflow-y-auto space-y-3 ${
        theme === "dark" ? "chat-pattern-dark" : "chat-pattern-light"
      }`}>
        {loading && (
          <div className="flex justify-center py-4">
            <span className={`text-xs px-3 py-1 rounded-full ${
              theme === "dark" ? "bg-[#18222d] text-[#8696a0]" : "bg-white text-gray-500 shadow-sm"
            }`}>
              Loading messages...
            </span>
          </div>
        )}
        {messages.map((msg, idx) => {
          const msgDate = msg.createdAt || msg.created_at || Date.now();
          const prevMsgDate = idx > 0 ? (messages[idx - 1].createdAt || messages[idx - 1].created_at) : null;
          const showDate = idx === 0 ||
            (prevMsgDate && format(new Date(prevMsgDate), "yyyy-MM-dd") !== format(new Date(msgDate), "yyyy-MM-dd"));

          return (
            <React.Fragment key={msg._id || msg.id}>
              {showDate && renderDateSeparator(msgDate)}
              <MessageBubble message={msg} />
            </React.Fragment>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      {/* File Preview Banner */}
      {filePreview && (
        <div className={`relative p-3 flex justify-center border-t ${
          theme === "dark" ? "bg-[#18222d] border-[#202c33]" : "bg-white border-gray-200"
        }`}>
          <img src={filePreview} alt="Preview" className="max-h-36 rounded-lg shadow-md object-cover" />
          <button
            onClick={() => { setFilePreview(null); setSelectedFile(null); }}
            className="absolute top-2 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Toolbar */}
      <div className={`p-3 flex items-center gap-2 relative ${
        theme === "dark" ? "bg-[#202c33]" : "bg-[#f0f2f5]"
      }`}>
        {/* Emoji Button */}
        <div className="relative" ref={emojiPickerRef}>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 rounded-full transition-colors ${
              theme === "dark" ? "text-[#8696a0] hover:bg-[#2a3942] hover:text-[#e9edef]" : "text-gray-600 hover:bg-gray-200"
            }`}
            title="Emoji"
          >
            <IoHappyOutline className="w-6 h-6" />
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden">
              <EmojiPicker
                theme={theme === "dark" ? "dark" : "light"}
                onEmojiClick={(emojiObj) => {
                  setMessage((prev) => prev + emojiObj.emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </div>

        {/* File Attachment Button */}
        <div className="relative">
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className={`p-2 rounded-full transition-colors ${
              theme === "dark" ? "text-[#8696a0] hover:bg-[#2a3942] hover:text-[#e9edef]" : "text-gray-600 hover:bg-gray-200"
            }`}
            title="Attach file"
          >
            <IoAttach className="w-6 h-6" />
          </button>
          {showFileMenu && (
            <div className={`absolute bottom-12 left-0 p-2 rounded-xl shadow-xl flex flex-col gap-1 w-40 z-50 border ${
              theme === "dark" ? "bg-[#18222d] border-[#202c33] text-[#e9edef]" : "bg-white border-gray-200 text-gray-800"
            }`}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`text-left text-xs font-semibold py-2 px-3 rounded-lg transition-colors ${
                  theme === "dark" ? "hover:bg-[#202c33]" : "hover:bg-gray-100"
                }`}
              >
                🖼 Image / Video
              </button>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden"
          />
        </div>

        {/* Input Text Box */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message"
          className={`flex-1 rounded-full px-4 py-2.5 text-sm outline-none transition-colors ${
            theme === "dark"
              ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] focus:ring-1 focus:ring-[#00a884]"
              : "bg-white text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-[#00a884] shadow-sm"
          }`}
        />

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={!message.trim() && !selectedFile}
          className={`p-2.5 rounded-full text-white transition-all shadow-md flex items-center justify-center ${
            message.trim() || selectedFile
              ? "bg-[#00a884] hover:bg-[#008f6f] scale-100 opacity-100"
              : "bg-[#00a884]/40 cursor-not-allowed scale-95 opacity-50"
          }`}
          title="Send"
        >
          <IoSend className="w-4 h-4" />
        </button>
      </div>

      {/* User Contact Profile Details Modal */}
      <AnimatePresence>
        {showUserProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowUserProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border flex flex-col select-none ${
                theme === "dark" ? "bg-[#111b21] text-[#e9edef] border-[#202c33]" : "bg-white text-gray-900 border-gray-200"
              }`}
            >
              {/* Profile Modal Header */}
              <div className={`p-4 flex items-center justify-between border-b ${
                theme === "dark" ? "border-[#202c33]" : "border-gray-100"
              }`}>
                <div className="flex items-center gap-2">
                  <IoPerson className="text-[#00a884]" />
                  <h3 className="font-bold text-base">Contact Info</h3>
                </div>
                <button
                  onClick={() => setShowUserProfileModal(false)}
                  className={`p-1.5 rounded-full hover:bg-gray-500/20 text-sm ${
                    theme === "dark" ? "text-[#8696a0]" : "text-gray-500"
                  }`}
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Card Body */}
              <div className="p-6 flex flex-col items-center text-center space-y-4">
                {/* Large Avatar */}
                <div className="relative">
                  <img
                    src={selectedContact.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contactId}`}
                    alt={selectedContact.username}
                    className="w-28 h-28 rounded-full object-cover border-4 border-[#00a884]"
                  />
                  {isOnline && (
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#00a884] border-2 border-[#111b21] rounded-full online-badge" />
                  )}
                </div>

                {/* Username & Status */}
                <div>
                  <h2 className="text-xl font-bold">{selectedContact.username}</h2>
                  <p className={`text-xs mt-1 ${isOnline ? "text-[#00a884] font-semibold" : theme === "dark" ? "text-[#8696a0]" : "text-gray-500"}`}>
                    {isOnline ? "🟢 Online" : lastSeen ? `Last seen at ${format(new Date(lastSeen), "HH:mm")}` : "Offline"}
                  </p>
                </div>

                {/* About Info Box */}
                <div className={`w-full p-3.5 rounded-xl text-left border ${
                  theme === "dark" ? "bg-[#202c33] border-[#202c33]" : "bg-[#f0f2f5] border-gray-100"
                }`}>
                  <span className="text-[11px] text-[#00a884] font-semibold block mb-1">About</span>
                  <p className="text-sm font-medium leading-snug">
                    {selectedContact.about || "Hey there! I am using Talkative."}
                  </p>
                </div>

                {/* Additional Info (Email / Phone) */}
                {(selectedContact.email || selectedContact.phoneNumber) && (
                  <div className={`w-full p-3.5 rounded-xl text-left border space-y-2 ${
                    theme === "dark" ? "bg-[#202c33] border-[#202c33]" : "bg-[#f0f2f5] border-gray-100"
                  }`}>
                    {selectedContact.email && (
                      <div>
                        <span className="text-[11px] text-[#00a884] font-semibold block">Email</span>
                        <p className="text-sm font-medium">{selectedContact.email}</p>
                      </div>
                    )}
                    {selectedContact.phoneNumber && (
                      <div>
                        <span className="text-[11px] text-[#00a884] font-semibold block">Phone</span>
                        <p className="text-sm font-medium">{selectedContact.phoneSuffix}{selectedContact.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWindow;
