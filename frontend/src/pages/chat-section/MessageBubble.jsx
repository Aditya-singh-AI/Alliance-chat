import React, { useState, useRef } from "react";
import { format } from "date-fns";
import { IoCheckmark, IoCheckmarkDone, IoChevronDown, IoCopy, IoTrash } from "react-icons/io5";
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

  // React on message
  const handleReactionClick = (emoji) => {
    addReaction(message._id || message.id, emoji);
    setShowReactionsMenu(false);
  };

  // Delete message
  const handleDelete = () => {
    deleteMessage(message._id || message.id);
    setShowOptions(false);
  };

  // Copy text to clipboard
  const handleCopy = () => {
    if (message.contentType === "text" && navigator.clipboard) {
      navigator.clipboard.writeText(message.content);
    }
    setShowOptions(false);
  };

  const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  const msgTimestamp = message.createdAt || message.created_at;

  const isDark = theme === "dark";

  return (
    <div className={`flex ${isUserMessage ? "justify-end" : "justify-start"} group relative mb-2 select-none`}>
      <div className="relative max-w-[75%] sm:max-w-[65%]">
        {/* Hover trigger buttons */}
        <div className={`absolute top-1 ${isUserMessage ? "-left-14" : "-right-14"} opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1`}>
          <button
            onClick={() => setShowReactionsMenu(!showReactionsMenu)}
            className={`p-1.5 rounded-full shadow-md text-xs transition-colors ${
              isDark ? "bg-[#202c33] text-[#8696a0] hover:text-white" : "bg-white text-gray-600 hover:text-black"
            }`}
            title="React"
          >
            😀
          </button>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`p-1.5 rounded-full shadow-md text-xs transition-colors ${
              isDark ? "bg-[#202c33] text-[#8696a0] hover:text-white" : "bg-white text-gray-600 hover:text-black"
            }`}
            title="Options"
          >
            <IoChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Message Bubble Container */}
        <div className={`rounded-2xl px-3.5 py-2 relative shadow-sm ${
          isUserMessage
            ? isDark
              ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none"
              : "bg-[#d9fdd3] text-gray-900 rounded-tr-none"
            : isDark
              ? "bg-[#202c33] text-[#e9edef] rounded-tl-none"
              : "bg-white text-gray-900 rounded-tl-none"
        }`}>
          {/* Media Attachment */}
          {message.contentType === "image" && (message.mediaUrl || message.imageOrVideoUrl) && (
            <img
              src={message.mediaUrl || message.imageOrVideoUrl}
              alt="attachment"
              className="rounded-xl max-h-72 w-full object-cover mb-1.5"
            />
          )}

          {message.contentType === "video" && (message.mediaUrl || message.imageOrVideoUrl) && (
            <video
              src={message.mediaUrl || message.imageOrVideoUrl}
              controls
              className="rounded-xl max-h-72 w-full mb-1.5"
            />
          )}

          {/* Message Text */}
          {message.content && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
              {message.content}
            </p>
          )}

          {/* Time & Status Read Receipt */}
          <div className="flex items-center justify-end gap-1 text-[10px] opacity-70 mt-0.5">
            <span>
              {msgTimestamp ? format(new Date(msgTimestamp), "HH:mm") : ""}
            </span>
            {isUserMessage && (
              <span className="flex items-center">
                {message.messageStatus === "sending" && <span className="animate-spin text-xs">⌛</span>}
                {message.messageStatus === "failed" && <span className="text-red-400 font-bold">!</span>}
                {message.messageStatus === "sent" && <IoCheckmark className="w-3.5 h-3.5" />}
                {(message.messageStatus === "delivered" || message.messageStatus === "read") && (
                  <IoCheckmarkDone className={`w-3.5 h-3.5 ${message.messageStatus === "read" ? "text-[#53bdeb]" : ""}`} />
                )}
              </span>
            )}
          </div>

          {/* Reaction Overlay Badges */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`absolute -bottom-2.5 ${isUserMessage ? "right-2" : "left-2"} flex gap-1 px-2 py-0.5 rounded-full text-xs shadow-md border ${
              isDark ? "bg-[#111b21] border-[#202c33]" : "bg-white border-gray-200"
            }`}>
              {message.reactions.map((react, i) => (
                <span key={i}>{react.emoji}</span>
              ))}
            </div>
          )}
        </div>

        {/* Options Dropdown Menu */}
        {showOptions && (
          <div
            ref={optionsRef}
            className={`absolute z-40 py-1 px-1 rounded-xl shadow-xl flex flex-col gap-0.5 text-xs w-32 top-8 ${
              isUserMessage ? "right-0" : "left-0"
            } ${
              isDark ? "bg-[#18222d] border border-[#202c33] text-[#e9edef]" : "bg-white border border-gray-200 text-gray-800"
            }`}
          >
            {message.contentType === "text" && (
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 w-full text-left py-1.5 px-3 rounded-lg font-medium transition-colors ${
                  isDark ? "hover:bg-[#202c33]" : "hover:bg-gray-100"
                }`}
              >
                <IoCopy className="w-3.5 h-3.5" />
                Copy
              </button>
            )}
            {isUserMessage && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full text-left py-1.5 px-3 rounded-lg font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <IoTrash className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        )}

        {/* Reaction Selection Menu */}
        {showReactionsMenu && (
          <div
            ref={reactionsRef}
            className={`absolute z-40 px-3 py-1.5 rounded-full shadow-2xl flex gap-3 top-8 border ${
              isUserMessage ? "right-0" : "left-0"
            } ${
              isDark ? "bg-[#111b21] border-[#202c33]" : "bg-white border-gray-200"
            }`}
          >
            {reactionEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className="hover:scale-125 transition-transform text-base"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
