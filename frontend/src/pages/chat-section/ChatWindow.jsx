import React, { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { isToday, isYesterday, format } from "date-fns";
import { IoSend, IoAttach, IoHappyOutline, IoArrowBack, IoLockClosed, IoClose, IoPerson, IoCall, IoVideocam } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../../store/useChatStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import useVideoCallStore from "../../store/useVideoCallStore";
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

  // Dynamic visual viewport height for mobile keyboards
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" && window.visualViewport
      ? window.visualViewport.height
      : null
  );

  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  const theme = useThemeStore((state) => state.theme);
  const currentUser = useChatStore((state) => state.currentUser);

  const { messages, loading, sendMessage, fetchMessages, conversations, startTyping, stopTyping, isUserTyping, isUserOnline, getUserLastSeen, currentConversation } = useChatStore();
  useChatStore((state) => state.onlineUsers);
  useChatStore((state) => state.typingUsers);

  useOutsideClick(emojiPickerRef, () => setShowEmojiPicker(false));

  const contactId = (selectedContact?._id || selectedContact?.id)?.toString();
  const isOnline = isUserOnline(contactId);
  const lastSeen = getUserLastSeen(contactId) || selectedContact?.lastSeen;
  const isTyping = isUserTyping(contactId, currentConversation);

  const scrollToBottom = (behavior = "smooth") => { messageEndRef.current?.scrollIntoView({ behavior, block: "end" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Handle dynamic visual viewport resize when mobile keyboard pops up
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleResize = () => {
      setViewportHeight(window.visualViewport.height);
      window.scrollTo(0, 0);
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);

    return () => {
      window.visualViewport.removeEventListener("resize", handleResize);
      window.visualViewport.removeEventListener("scroll", handleResize);
    };
  }, []);

  useEffect(() => {
    if (selectedContact) {
      const convId = selectedContact.conversation?._id || selectedContact.conversation?.id;
      if (convId) { fetchMessages(convId); }
      else if (conversations?.data?.length > 0) {
        const conversation = conversations.data.find((conv) => conv.participants && conv.participants.some((p) => (p._id || p.id)?.toString() === contactId));
        if (conversation) fetchMessages(conversation._id || conversation.id);
      }
    }
  }, [selectedContact, conversations, fetchMessages, contactId]);

  useEffect(() => {
    if (!contactId) return;
    if (message.trim()) {
      startTyping(contactId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(contactId);
      }, 2500);
    } else {
      stopTyping(contactId);
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [message, contactId, startTyping, stopTyping]);

  const handleInputFocus = () => {
    window.scrollTo(0, 0);
    if (typeof window !== "undefined" && window.visualViewport) {
      setViewportHeight(window.visualViewport.height);
    }
    setTimeout(() => {
      scrollToBottom();
    }, 120);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setShowFileMenu(false); if (file.type.startsWith("image/")) setFilePreview(URL.createObjectURL(file)); }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) return;
    stopTyping(contactId);
    const formData = new FormData();
    formData.append("senderId", currentUser?._id || currentUser?.id);
    formData.append("receiverId", contactId);
    formData.append("messageStatus", isOnline ? "delivered" : "sent");
    if (message.trim()) formData.append("content", message.trim());
    if (selectedFile) formData.append("media", selectedFile);
    setMessage(""); setSelectedFile(null); setFilePreview(null); setShowFileMenu(false);
    try { await sendMessage(formData); } catch (err) { console.error("Failed:", err); }
  };

  const handleKeyPress = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };

  const renderDateSeparator = (dateString) => {
    const date = new Date(dateString);
    let day = "";
    if (isToday(date)) day = "Today";
    else if (isYesterday(date)) day = "Yesterday";
    else day = format(date, "dd MMM yyyy");
    return (
      <div className="flex justify-center my-4">
        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
          theme === "dark" ? "bg-[#27272A] text-[#71717A] border border-[#3F3F46]" : "bg-white text-[#A8A29E] border border-[#E7E5E4] shadow-sm"
        }`}>{day}</span>
      </div>
    );
  };

  const isDark = theme === "dark";

  if (!selectedContact) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 select-none ${isDark ? "bg-[#09090B]" : "bg-[#FAFAF9]"}`}>
        <div className="w-20 h-20 accent-gradient rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-orange-500/15">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold mb-2 accent-gradient-text">Start Chatting</h2>
        <p className={`text-sm max-w-xs leading-relaxed ${isDark ? "text-[#71717A]" : "text-[#A8A29E]"}`}>
          Select a contact from the sidebar to start a conversation.
        </p>
        <div className={`flex items-center gap-1.5 text-xs font-semibold mt-4 ${isDark ? "text-[#3F3F46]" : "text-[#D6D3D1]"}`}>
          <IoLockClosed className="w-3 h-3" /> End-to-end encrypted
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ height: viewportHeight ? `${viewportHeight}px` : "100dvh" }}
      className={`flex-1 flex flex-col w-full overflow-hidden ${isDark ? "bg-[#09090B]" : "bg-[#FAFAF9]"}`}
    >
      {/* Sticky Locked Header: Profile Photo, Name, and Live Status */}
      <div className={`sticky top-0 z-30 flex-shrink-0 px-4 py-2.5 flex items-center justify-between border-b backdrop-blur-xl ${
        isDark ? "bg-[#18181B]/95 border-[#27272A]" : "bg-white/95 border-[#E7E5E4]"
      }`}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button onClick={() => setSelectedContact(null)} className="md:hidden text-lg p-1.5 rounded-xl hover:bg-[#27272A] flex-shrink-0 text-current" aria-label="Back">
            <IoArrowBack />
          </button>
          <div onClick={() => setShowUserProfileModal(true)} className="flex items-center gap-3 cursor-pointer group min-w-0 flex-1" title="View Profile">
            <div className="relative flex-shrink-0">
              <img src={selectedContact.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contactId}`}
                alt="Profile" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover group-hover:opacity-90 transition-opacity"
              />
              {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[#18181B] rounded-full online-badge" />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className={`font-extrabold text-xs sm:text-sm leading-tight truncate transition-colors ${isDark ? 'group-hover:text-[#F97316]' : 'group-hover:text-[#F97316]'}`}>
                {selectedContact.username}
              </h4>
              <p className="text-[10px] sm:text-[11px] font-bold truncate mt-0.5">
                {isTyping ? (
                  <span className="text-[#F97316] font-extrabold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#F97316] inline-block animate-ping" />
                    typing...
                  </span>
                ) : isOnline ? (
                  <span className="text-green-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-ping" />
                    online
                  </span>
                ) : lastSeen ? (
                  <span className={isDark ? "text-[#71717A]" : "text-[#A8A29E]"}>last seen {format(new Date(lastSeen), "HH:mm")}</span>
                ) : (
                  <span className={isDark ? "text-[#71717A]" : "text-[#A8A29E]"}>offline</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Video & Audio Call Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => {
              const initCall = useVideoCallStore.getState().initiateCall;
              if (initCall) initCall(contactId, selectedContact.username, selectedContact.profilePicture, "audio");
            }}
            className={`p-2 rounded-xl transition-colors ${isDark ? "text-[#71717A] hover:bg-[#27272A] hover:text-[#FAFAFA]" : "text-[#A8A29E] hover:bg-[#F5F5F4] hover:text-[#0C0A09]"}`}
            title="Voice Call"
          >
            <IoCall className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={() => {
              const initCall = useVideoCallStore.getState().initiateCall;
              if (initCall) initCall(contactId, selectedContact.username, selectedContact.profilePicture, "video");
            }}
            className={`p-2 rounded-xl transition-colors ${isDark ? "text-[#71717A] hover:bg-[#27272A] hover:text-[#FAFAFA]" : "text-[#A8A29E] hover:bg-[#F5F5F4] hover:text-[#0C0A09]"}`}
            title="Video Call"
          >
            <IoVideocam className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className={`flex-1 min-h-0 px-3 sm:px-4 pt-3 pb-12 overflow-y-auto overscroll-contain space-y-2.5 touch-pan-y ${isDark ? "chat-pattern-dark" : "chat-pattern-light"}`}>
        {loading && (
          <div className="flex justify-center py-4">
            <span className={`text-xs px-4 py-1.5 rounded-xl font-medium ${isDark ? "bg-[#27272A] text-[#71717A]" : "bg-white text-[#A8A29E] shadow-sm"}`}>
              Loading...
            </span>
          </div>
        )}
        {messages.map((msg, idx) => {
          const msgDate = msg.createdAt || msg.created_at || Date.now();
          const prevMsgDate = idx > 0 ? (messages[idx - 1].createdAt || messages[idx - 1].created_at) : null;
          const showDate = idx === 0 || (prevMsgDate && format(new Date(prevMsgDate), "yyyy-MM-dd") !== format(new Date(msgDate), "yyyy-MM-dd"));
          return (
            <React.Fragment key={msg._id || msg.id}>
              {showDate && renderDateSeparator(msgDate)}
              <MessageBubble message={msg} />
            </React.Fragment>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      {/* File Preview */}
      {filePreview && (
        <div className={`relative p-3 flex justify-center border-t flex-shrink-0 ${isDark ? "bg-[#18181B] border-[#27272A]" : "bg-white border-[#E7E5E4]"}`}>
          <img src={filePreview} alt="Preview" className="max-h-36 rounded-xl shadow-md object-cover" />
          <button onClick={() => { setFilePreview(null); setSelectedFile(null); }}
            className="absolute top-2 right-4 bg-red-600 hover:bg-red-700 text-white rounded-xl w-7 h-7 flex items-center justify-center text-xs shadow-md"
          >✕</button>
        </div>
      )}

      {/* Input Field - Fixed at bottom of active visual viewport */}
      <div className={`px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 border-t flex-shrink-0 z-30 ${isDark ? "bg-[#18181B] border-[#27272A]" : "bg-white border-[#E7E5E4]"}`}>
        <div className="relative" ref={emojiPickerRef}>
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2.5 rounded-xl transition-colors ${isDark ? "text-[#71717A] hover:bg-[#27272A] hover:text-[#FAFAFA]" : "text-[#A8A29E] hover:bg-[#F5F5F4] hover:text-[#0C0A09]"}`}
          ><IoHappyOutline className="w-5 h-5" /></button>
          {showEmojiPicker && (
            <div className="absolute bottom-14 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden">
              <EmojiPicker theme={theme === "dark" ? "dark" : "light"} onEmojiClick={(emojiObj) => { setMessage((p) => p + emojiObj.emoji); setShowEmojiPicker(false); }} />
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setShowFileMenu(!showFileMenu)}
            className={`p-2.5 rounded-xl transition-colors ${isDark ? "text-[#71717A] hover:bg-[#27272A] hover:text-[#FAFAFA]" : "text-[#A8A29E] hover:bg-[#F5F5F4] hover:text-[#0C0A09]"}`}
          ><IoAttach className="w-5 h-5" /></button>
          {showFileMenu && (
            <div className={`absolute bottom-14 left-0 p-2 rounded-xl shadow-2xl flex flex-col gap-1 w-40 z-50 border ${
              isDark ? "bg-[#18181B] border-[#27272A] text-[#FAFAFA]" : "bg-white border-[#E7E5E4] text-[#0C0A09]"
            }`}>
              <button onClick={() => fileInputRef.current?.click()}
                className={`text-left text-xs font-bold py-2.5 px-3 rounded-lg transition-colors ${isDark ? "hover:bg-[#27272A]" : "hover:bg-[#F5F5F4]"}`}
              >🖼 Image / Video</button>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
        </div>

        <input type="text" name="chat-message-input" id="chat-message-input" autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck="true" data-lpignore="true" data-form-type="other" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyPress} onFocus={handleInputFocus}
          placeholder="Type a message..."
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all border ${
            isDark ? "bg-[#27272A] text-[#FAFAFA] placeholder-[#71717A] border-[#27272A] focus:border-[#F97316]/50" : "bg-[#F5F5F4] text-[#0C0A09] placeholder-[#A8A29E] border-[#F5F5F4] focus:border-[#F97316]/50"
          }`}
        />

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
          onClick={handleSendMessage} disabled={!message.trim() && !selectedFile}
          className={`p-2.5 rounded-xl text-white transition-all flex items-center justify-center flex-shrink-0 ${
            message.trim() || selectedFile ? "accent-gradient shadow-md shadow-orange-500/20" : isDark ? "bg-[#27272A] text-[#71717A] cursor-not-allowed" : "bg-[#E7E5E4] text-[#A8A29E] cursor-not-allowed"
          }`}
        ><IoSend className="w-4 h-4 flex-shrink-0" /></motion.button>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showUserProfileModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowUserProfileModal(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border-2 flex flex-col select-none ${
                isDark ? "bg-[#18181B] text-[#FAFAFA] border-[#27272A]" : "bg-white text-[#0C0A09] border-[#E7E5E4]"
              }`}
            >
              <div className="h-1.5 w-full accent-gradient" />

              <div className={`p-4 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <IoPerson className="text-[#F97316]" />
                  <h3 className="font-extrabold text-sm">Contact Info</h3>
                </div>
                <button onClick={() => setShowUserProfileModal(false)}
                  className={`p-1.5 rounded-lg ${isDark ? "text-[#71717A] hover:bg-[#27272A]" : "text-[#A8A29E] hover:bg-[#F5F5F4]"}`}
                ><IoClose className="w-5 h-5" /></button>
              </div>

              <div className="px-6 pb-6 flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl accent-gradient p-[3px]">
                    <div className={`w-full h-full rounded-[14px] overflow-hidden ${isDark ? 'bg-[#09090B]' : 'bg-white'}`}>
                      <img src={selectedContact.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contactId}`}
                        alt={selectedContact.username} className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  {isOnline && <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#18181B] rounded-full online-badge" />}
                </div>

                <div>
                  <h2 className="text-lg font-extrabold">{selectedContact.username}</h2>
                  <p className={`text-xs mt-1 font-medium ${isOnline ? "text-green-500" : isDark ? "text-[#71717A]" : "text-[#A8A29E]"}`}>
                    {isOnline ? "Online now" : lastSeen ? `Last seen ${format(new Date(lastSeen), "HH:mm")}` : "Offline"}
                  </p>
                </div>

                <div className={`w-full p-4 rounded-xl text-left border ${isDark ? "bg-[#27272A] border-[#3F3F46]" : "bg-[#F5F5F4] border-[#E7E5E4]"}`}>
                  <span className="text-[10px] text-[#F97316] font-bold uppercase tracking-widest block mb-1.5">About</span>
                  <p className="text-sm font-medium">{selectedContact.about || "Hey there! I am using Alliance."}</p>
                </div>

                {(selectedContact.email || selectedContact.phoneNumber) && (
                  <div className={`w-full p-4 rounded-xl text-left border space-y-3 ${isDark ? "bg-[#27272A] border-[#3F3F46]" : "bg-white border-[#E7E5E4]"}`}>
                    {selectedContact.email && (
                      <div><span className="text-[10px] text-[#F97316] font-bold uppercase tracking-widest block">Email</span><p className="text-sm font-medium mt-0.5">{selectedContact.email}</p></div>
                    )}
                    {selectedContact.phoneNumber && (
                      <div><span className="text-[10px] text-[#F97316] font-bold uppercase tracking-widest block">Phone</span><p className="text-sm font-medium mt-0.5">{selectedContact.phoneSuffix}{selectedContact.phoneNumber}</p></div>
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
