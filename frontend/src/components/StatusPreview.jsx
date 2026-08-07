import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function StatusPreview({ story, onClose }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 15000; // 15 seconds
    const interval = 100;   // tick every 100ms
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          onClose();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col justify-between p-4"
    >
      {/* Top: progress bar + user info */}
      <div className="w-full z-10 space-y-3">
        <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={story.user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.user?._id}`}
              alt={story.user?.username}
              className="w-10 h-10 rounded-full object-cover border border-white"
            />
            <div>
              <p className="text-white font-bold text-sm">{story.user?.username}</p>
              <p className="text-gray-400 text-xs">Status Update</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white text-xl font-bold hover:scale-110 transition"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-2">
        {story.content && (
          <p className="text-white text-lg text-center max-w-md px-4 mb-4 font-medium leading-relaxed italic bg-black bg-opacity-40 p-3 rounded-lg">
            "{story.content}"
          </p>
        )}
        {story.mediaUrl && (
          <div className="max-w-full max-h-[60vh] rounded-lg overflow-hidden flex items-center justify-center shadow-lg border border-gray-800">
            <img
              src={story.mediaUrl}
              alt="Story Content"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="h-10 text-center">
        <p className="text-xs text-gray-500">Auto-expires in 24 hours</p>
      </div>
    </motion.div>
  );
}
