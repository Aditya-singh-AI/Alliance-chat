import React, { useState, useRef } from "react";
import { format } from "date-fns";
import { IoCheckmark, IoCheckmarkDone, IoChevronDown, IoCopy, IoTrash, IoClose, IoDownload } from "react-icons/io5";
import { useChatStore } from "../../store/useChatStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useOutsideClick } from "../../hooks/useOutsideClick";

const MessageBubble = ({ message }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);

  const optionsRef = useRef(null);
  const reactionsRef = useRef(null);

  const theme = useThemeStore((state) => state.theme);
  const currentUser = useChatStore((state) => state.currentUser);
  const { addReaction, deleteMessage } = useChatStore();

  useOutsideClick(optionsRef, () => setShowOptions(false));
  useOutsideClick(reactionsRef, () => setShowReactionsMenu(false));

  const senderId = message.sender?._id || message.sender?.id || message.sender;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isUserMessage = senderId === currentUserId;

  const handleReactionClick = (emoji) => { addReaction(message._id || message.id, emoji); setShowReactionsMenu(false); };
  const handleDelete = () => { deleteMessage(message._id || message.id); setShowOptions(false); };
  const handleCopy = () => { if (message.contentType === "text" && navigator.clipboard) navigator.clipboard.writeText(message.content); setShowOptions(false); };

  const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  const msgTimestamp = message.createdAt || message.created_at;
  const isDark = theme === "dark";
  const [showFullImage, setShowFullImage] = useState(false);
  const mediaSrc = message.mediaUrl || message.imageOrVideoUrl;

  return (
    <div className={`flex ${isUserMessage ? "justify-end" : "justify-start"} group relative mb-1.5 select-none`}>
      <div className="relative max-w-[85%] sm:max-w-[70%]">
        {/* Hover buttons */}
        <div className={`absolute top-1 ${isUserMessage ? "-left-12" : "-right-12"} opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-0.5`}>
          <button onClick={() => setShowReactionsMenu(!showReactionsMenu)}
            className={`p-1 rounded-lg shadow text-xs transition-colors ${isDark ? "bg-[#27272A] text-[#71717A] hover:text-white" : "bg-white text-[#A8A29E] hover:text-[#0C0A09] shadow-md"}`}
          >😀</button>
          <button onClick={() => setShowOptions(!showOptions)}
            className={`p-1 rounded-lg shadow text-xs transition-colors ${isDark ? "bg-[#27272A] text-[#71717A] hover:text-white" : "bg-white text-[#A8A29E] hover:text-[#0C0A09] shadow-md"}`}
          ><IoChevronDown className="w-3 h-3" /></button>
        </div>

        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-2.5 relative ${
          isUserMessage
            ? isDark
              ? "bg-[#F97316]/15 text-[#FAFAFA] border border-[#F97316]/10"
              : "bg-[#FFF7ED] text-[#0C0A09] border border-orange-100"
            : isDark
              ? "bg-[#27272A] text-[#FAFAFA] border border-[#3F3F46]/50"
              : "bg-white text-[#0C0A09] border border-[#E7E5E4] shadow-sm"
        }`}>
          {/* Media */}
          {message.contentType === "image" && mediaSrc && (
            <img src={mediaSrc} alt="attachment" onClick={() => setShowFullImage(true)}
              className="rounded-xl max-h-72 w-full object-cover mb-2 cursor-pointer hover:opacity-90 transition-opacity"
            />
          )}
          {message.contentType === "video" && (message.mediaUrl || message.imageOrVideoUrl) && (
            <video src={message.mediaUrl || message.imageOrVideoUrl} controls className="rounded-xl max-h-72 w-full mb-2" />
          )}

          {/* Text */}
          {message.content && (
            <p className="text-[13.5px] leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Time & Status */}
          <div className={`flex items-center justify-end gap-1 mt-1 ${isUserMessage && isDark ? 'text-[#F97316]/50' : isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
            <span className="text-[10px] font-medium">
              {msgTimestamp ? format(new Date(msgTimestamp), "HH:mm") : ""}
            </span>
            {isUserMessage && (
              <span className="flex items-center">
                {message.messageStatus === "sending" && <span className="animate-spin text-[10px]">⌛</span>}
                {message.messageStatus === "failed" && <span className="text-red-400 font-bold text-[10px]">!</span>}
                {message.messageStatus === "sent" && <IoCheckmark className="w-3.5 h-3.5" />}
                {(message.messageStatus === "delivered" || message.messageStatus === "read") && (
                  <IoCheckmarkDone className={`w-3.5 h-3.5 ${message.messageStatus === "read" ? "text-[#F97316]" : ""}`} />
                )}
              </span>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`absolute -bottom-2.5 ${isUserMessage ? "right-2" : "left-2"} flex gap-0.5 px-2 py-0.5 rounded-lg text-xs shadow-md border ${
              isDark ? "bg-[#18181B] border-[#27272A]" : "bg-white border-[#E7E5E4]"
            }`}>
              {message.reactions.map((react, i) => <span key={i}>{react.emoji}</span>)}
            </div>
          )}
        </div>

        {/* Options Menu */}
        {showOptions && (
          <div ref={optionsRef}
            className={`absolute z-40 py-1.5 px-1.5 rounded-xl shadow-2xl flex flex-col gap-0.5 text-xs w-32 top-8 ${isUserMessage ? "right-0" : "left-0"} ${
              isDark ? "bg-[#18181B] border border-[#27272A] text-[#FAFAFA]" : "bg-white border border-[#E7E5E4] text-[#0C0A09] shadow-xl"
            }`}
          >
            {message.contentType === "text" && (
              <button onClick={handleCopy}
                className={`flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg font-medium transition-colors ${isDark ? "hover:bg-[#27272A]" : "hover:bg-[#F5F5F4]"}`}
              ><IoCopy className="w-3.5 h-3.5" /> Copy</button>
            )}
            {isUserMessage && (
              <button onClick={handleDelete}
                className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              ><IoTrash className="w-3.5 h-3.5" /> Delete</button>
            )}
          </div>
        )}

        {/* Reactions Menu */}
        {showReactionsMenu && (
          <div ref={reactionsRef}
            className={`absolute z-40 px-3 py-2 rounded-2xl shadow-2xl flex gap-2 top-8 border ${isUserMessage ? "right-0" : "left-0"} ${
              isDark ? "bg-[#18181B] border-[#27272A]" : "bg-white border-[#E7E5E4] shadow-xl"
            }`}
          >
            {reactionEmojis.map((emoji) => (
              <button key={emoji} onClick={() => handleReactionClick(emoji)} className="hover:scale-125 transition-transform text-base">{emoji}</button>
            ))}
          </div>
        )}

        {/* Fullscreen Image */}
        {showFullImage && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowFullImage(false)}>
            <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center">
              <button onClick={() => setShowFullImage(false)} className="absolute -top-12 right-0 text-white bg-white/20 hover:bg-white/30 p-2.5 rounded-xl transition-all" title="Close">
                <IoClose className="w-5 h-5" />
              </button>
              <a href={mediaSrc} download="photo" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                className="absolute -top-12 right-12 text-white bg-white/20 hover:bg-white/30 p-2.5 rounded-xl transition-all" title="Download"
              ><IoDownload className="w-5 h-5" /></a>
              <img src={mediaSrc} alt="Full size" onClick={(e) => e.stopPropagation()}
                className="max-h-[85vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
