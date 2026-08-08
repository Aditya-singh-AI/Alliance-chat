import React from 'react';
import { motion } from 'framer-motion';
import { IoChatbubblesSharp } from 'react-icons/io5';

// Full-screen page loader displayed during auth verification
const Loader = () => {
  return (
    <div className="fixed inset-0 bg-[#09090B] flex flex-col items-center justify-center z-50">
      <motion.div
        animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-8"
      >
        <div className="w-20 h-20 accent-gradient rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/20">
          <IoChatbubblesSharp className="w-12 h-12 text-white" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="text-2xl font-extrabold text-[#FAFAFA] mb-2 tracking-tight"
      >
        Talkative
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-[#71717A] text-sm font-medium mb-8"
      >
        Connecting you...
      </motion.p>

      <div className="w-48 bg-[#27272A] rounded-full h-1 overflow-hidden">
        <div className="accent-gradient h-1 rounded-full animate-infinite-loading w-1/3" />
      </div>
    </div>
  );
};

export default Loader;
