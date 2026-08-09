import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaComment, FaTimes, FaReply } from "react-icons/fa";
import { useChatStore } from "../store/useChatStore";
import { useLayoutStore } from "../store/useLayoutStore";
import { useThemeStore } from "../store/useThemeStore";
import { useNavigate } from "react-router-dom";

const NotificationPopup = () => {
  const { incomingNotification, dismissNotification } = useChatStore();
  const { setSelectedContact, setActiveTab } = useLayoutStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const isDark = theme === "dark";

  useEffect(() => {
    if (incomingNotification) {
      const timer = setTimeout(() => {
        dismissNotification();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [incomingNotification, dismissNotification]);

  if (!incomingNotification) return null;

  const sender = incomingNotification.sender || {};
  const senderId = (sender._id || sender.id || incomingNotification.sender)?.toString();
  const senderName = sender.username || "Someone";
  const avatar = sender.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderId || "default"}`;

  const messageText = incomingNotification.content
    ? incomingNotification.content
    : incomingNotification.contentType === "image"
      ? "📷 Sent a photo"
      : incomingNotification.contentType === "video"
        ? "🎥 Sent a video"
        : "Sent a message";

  const handleOpenChat = () => {
    if (sender) {
      setSelectedContact(sender);
      setActiveTab("chats");
      navigate("/");
    }
    dismissNotification();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -80, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 26 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm select-none cursor-pointer"
        onClick={handleOpenChat}
      >
        <div
          className={`relative p-3.5 rounded-3xl backdrop-blur-2xl shadow-2xl border flex items-center gap-3.5 transition-all duration-200 ${
            isDark
              ? "bg-[#18181B]/95 text-[#FAFAFA] border-[#27272A] shadow-orange-500/10 hover:border-[#F97316]/40"
              : "bg-white/95 text-[#0C0A09] border-[#E7E5E4] shadow-xl shadow-black/10 hover:border-[#F97316]/40"
          }`}
        >
          {/* Instagram Gradient Ring Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md">
              <img
                src={avatar}
                alt={senderName}
                className={`w-full h-full rounded-full object-cover border-2 ${
                  isDark ? "border-[#18181B]" : "border-white"
                }`}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#F97316] text-white p-1 rounded-full shadow-sm">
              <FaComment className="text-[9px]" />
            </div>
          </div>

          {/* Info & Content Snippet */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <h4 className="font-extrabold text-xs sm:text-sm truncate leading-tight">
                {senderName}
              </h4>
              <span className={`text-[10px] font-semibold flex-shrink-0 ${
                isDark ? "text-[#F97316]" : "text-[#F97316]"
              }`}>
                Just now
              </span>
            </div>
            <p className={`text-xs truncate font-medium ${
              isDark ? "text-[#A1A1AA]" : "text-[#71717A]"
            }`}>
              {messageText}
            </p>
          </div>

          {/* Action Button: Instagram style Reply button */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenChat();
              }}
              className="px-3 py-1.5 accent-gradient text-white text-xs font-bold rounded-2xl shadow-md shadow-orange-500/25 flex items-center gap-1.5"
            >
              <FaReply className="text-[10px]" />
              <span>Reply</span>
            </motion.button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissNotification();
              }}
              className={`p-1.5 rounded-full transition-colors ${
                isDark ? "hover:bg-[#27272A] text-[#71717A]" : "hover:bg-[#F5F5F4] text-[#A8A29E]"
              }`}
              title="Close"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPopup;
