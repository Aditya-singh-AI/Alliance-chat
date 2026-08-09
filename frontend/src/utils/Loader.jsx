import React from 'react';
import { motion } from 'framer-motion';

// Full-screen page loader displayed during auth verification
const Loader = () => {
  return (
    <div className="fixed inset-0 bg-[#09090B] flex flex-col items-center justify-center z-50">
      <motion.div
        animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-8"
      >
        <div className="relative">
          <img
            src="/logo-orange.jpg"
            alt="Alliance Logo"
            className="w-24 h-24 rounded-3xl object-cover shadow-2xl shadow-orange-500/30 border border-orange-500/20"
          />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="text-2xl font-extrabold text-[#FAFAFA] mb-2 tracking-tight"
      >
        Alliance
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
