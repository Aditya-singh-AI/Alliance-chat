import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutStore } from '../store/useLayoutStore';
import { useThemeStore } from '../store/useThemeStore';
import { useUserStore } from '../store/useUserStore';
import { useSocketStore } from '../store/useSocketStore';
import SideBar from './SideBar';
import ChatWindow from '../pages/chat-section/ChatWindow';

const Layout = ({ children }) => {
  const { selectedContact, setSelectedContact } = useLayoutStore();
  const { theme, setTheme } = useThemeStore();
  const { user } = useUserStore();
  const { connect: connectSocket } = useSocketStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Connect socket globally once user is authenticated
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      connectSocket(userId);
    }
  }, [user?._id, user?.id, connectSocket]);

  // Real-time responsive detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex relative overflow-hidden font-sans select-none ${
      isDark ? 'bg-[#0b141a] text-[#e9edef]' : 'bg-[#f0f2f5] text-gray-900'
    }`}>
      {/* Sidebar: hidden on mobile when a chat is open */}
      {(!isMobile || !selectedContact) && (
        <SideBar isMobile={isMobile} onThemeClick={() => setShowThemeModal(true)} />
      )}

      {/* Main content panels */}
      <div className={`flex flex-1 ${isMobile ? 'flex-col' : 'flex-row'} h-screen overflow-hidden`}>
        <AnimatePresence mode="wait">
          {/* LEFT PANEL: Chat list / nav page */}
          {(!isMobile || !selectedContact) && (
            <motion.div
              key="list-panel"
              initial={{ opacity: 0, x: isMobile ? -60 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isMobile ? -60 : 0 }}
              transition={{ duration: 0.2 }}
              className={`h-full overflow-hidden ${isMobile ? 'w-full' : 'w-[400px] lg:w-[420px] flex-shrink-0'} border-r ${
                isDark ? 'border-[#202c33]' : 'border-gray-200'
              }`}
            >
              {children}
            </motion.div>
          )}

          {/* RIGHT PANEL: Chat window or empty state */}
          {(!isMobile || selectedContact) && (
            <motion.div
              key="chat-window"
              initial={{ opacity: 0, x: isMobile ? 60 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isMobile ? 60 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 h-full overflow-hidden"
            >
              {selectedContact ? (
                <ChatWindow selectedContact={selectedContact} setSelectedContact={setSelectedContact} />
              ) : (
                /* Empty state for desktop when no chat is selected */
                <div className={`h-full flex flex-col items-center justify-center text-center p-8 ${
                  isDark ? 'bg-[#111b21] text-[#e9edef]' : 'bg-[#f0f2f5] text-gray-800'
                }`}>
                  <div className="w-24 h-24 bg-[#00a884]/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-[#00a884]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Talkative Web</h3>
                  <p className={`text-xs max-w-sm ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                    Send and receive messages without keeping your phone online. Select a contact to get started.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Theme Selection Modal */}
      <AnimatePresence>
        {showThemeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowThemeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`p-6 rounded-2xl shadow-2xl w-full max-w-sm border ${
                isDark ? 'bg-[#111b21] text-[#e9edef] border-[#202c33]' : 'bg-white text-gray-900 border-gray-200'
              }`}
            >
              <h2 className="text-lg font-bold mb-1">Appearance</h2>
              <p className={`text-xs mb-5 ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>Choose your preferred theme</p>

              <div className="space-y-3">
                {['dark', 'light'].map((t) => (
                  <label
                    key={t}
                    className={`flex items-center gap-4 p-3.5 rounded-xl cursor-pointer border-2 transition-all ${
                      theme === t
                        ? 'border-[#00a884] bg-[#00a884]/10'
                        : isDark
                        ? 'border-[#202c33] hover:border-[#2a3942]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      checked={theme === t}
                      onChange={() => setTheme(t)}
                      className="accent-[#00a884]"
                    />
                    <div>
                      <p className="font-semibold text-sm capitalize">{t} Mode</p>
                      <p className={`text-xs ${isDark ? 'text-[#8696a0]' : 'text-gray-500'}`}>
                        {t === 'dark' ? 'WhatsApp/Telegram dark palette' : 'Clean & bright interface'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <button
                id="close-theme-modal"
                onClick={() => setShowThemeModal(false)}
                className="mt-5 w-full py-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold text-sm rounded-xl transition-colors shadow-md"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
