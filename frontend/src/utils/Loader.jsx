import React from 'react';
import { motion } from 'framer-motion';
import { IoChatbubblesSharp } from 'react-icons/io5';

// Full-screen page loader displayed during auth verification
const Loader = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center z-50">
      {/* Animated logo */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="mb-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl pulse-glow">
          <IoChatbubblesSharp className="w-12 h-12 text-white" />
        </div>
      </motion.div>

      {/* App name */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-white mb-2 tracking-wide"
      >
        Talkative
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-purple-300 text-sm mb-8"
      >
        Connecting you...
      </motion.p>

      {/* Progress bar */}
      <div className="w-48 bg-gray-800 rounded-full h-1 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-1 rounded-full animate-infinite-loading w-1/3" />
      </div>
    </div>
  );
};

export default Loader;
