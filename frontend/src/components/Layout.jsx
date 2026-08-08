import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutStore } from '../store/useLayoutStore';
import { useThemeStore } from '../store/useThemeStore';
import { useUserStore } from '../store/useUserStore';
import { useSocketStore } from '../store/useSocketStore';
import SideBar from './SideBar';
import ChatWindow from '../pages/chat-section/ChatWindow';

const Layout = ({ children }) => {
  const { selectedContact, setSelectedContact, setActiveTab } = useLayoutStore();
  const { theme, setTheme } = useThemeStore();
  const { user } = useUserStore();
  const { connect: connectSocket } = useSocketStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  // Sync store activeTab with current route
  useEffect(() => {
    if (location.pathname === '/') setActiveTab('chats');
    else if (location.pathname === '/status') setActiveTab('status');
    else if (location.pathname === '/settings') setActiveTab('settings');
  }, [location.pathname, setActiveTab]);

  // Connect socket globally once user is authenticated
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) { connectSocket(userId); }
  }, [user?._id, user?.id, connectSocket]);

  // Real-time responsive detection & visual viewport adjustment for mobile keyboards
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        window.scrollTo(0, 0);
      }
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
      window.visualViewport.addEventListener('scroll', handleVisualViewportResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
        window.visualViewport.removeEventListener('scroll', handleVisualViewportResize);
      }
    };
  }, []);

  // WhatsApp-style mobile hardware/browser back button handling
  useEffect(() => {
    if (!isMobile) return;

    if (selectedContact) {
      window.history.pushState({ chatOpen: true }, '');

      const handlePopState = () => {
        setSelectedContact(null);
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isMobile, selectedContact, setSelectedContact]);

  // Touch swipe gestures for mobile tab switching & swipe to close chat
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e) => {
    if (!isMobile) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartRef.current.x - touchEndX;
    const deltaY = touchStartRef.current.y - touchEndY;
    const duration = Date.now() - touchStartRef.current.time;

    // Strict check: Ignore any touch with vertical movement or slow drag to avoid scroll interference
    if (duration > 500 || Math.abs(deltaY) * 1.5 > Math.abs(deltaX) || Math.abs(deltaX) < 60) return;

    // If chat window is open on mobile
    if (selectedContact) {
      // Only close if swipe originates from far left edge (< 30px)
      if (touchStartRef.current.x < 30 && deltaX < -80) {
        setSelectedContact(null);
      }
      return;
    }

    // Swipe between tabs: Chats (/) <-> Status (/status) <-> Settings (/settings)
    const routes = ['/', '/status', '/settings'];
    const tabMap = { '/': 'chats', '/status': 'status', '/settings': 'settings' };
    const currentIndex = routes.indexOf(location.pathname);

    if (currentIndex === -1) return;

    if (deltaX > 60 && currentIndex < routes.length - 1) {
      // Swipe Left -> Next Tab
      const nextRoute = routes[currentIndex + 1];
      setActiveTab(tabMap[nextRoute]);
      navigate(nextRoute);
    } else if (deltaX < -60 && currentIndex > 0) {
      // Swipe Right -> Previous Tab
      const prevRoute = routes[currentIndex - 1];
      setActiveTab(tabMap[prevRoute]);
      navigate(prevRoute);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`h-[100dvh] w-full flex relative overflow-hidden font-sans select-none ${
        isDark ? 'bg-[#09090B] text-[#FAFAFA]' : 'bg-[#FAFAF9] text-[#0C0A09]'
      }`}
    >
      {/* Sidebar: hidden on mobile when a chat is open */}
      {(!isMobile || !selectedContact) && (
        <SideBar isMobile={isMobile} onThemeClick={() => setShowThemeModal(true)} />
      )}

      {/* Main content panels */}
      <div className={`flex flex-1 ${isMobile ? 'flex-col' : 'flex-row'} h-[100dvh] overflow-hidden`}>
        <AnimatePresence mode="wait">
          {/* LEFT PANEL: Chat list / nav page */}
          {(!isMobile || !selectedContact) && (
            <motion.div
              key="list-panel"
              initial={{ opacity: 0, x: isMobile ? -60 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isMobile ? -60 : 0 }}
              transition={{ duration: 0.2 }}
              className={`h-full overflow-hidden ${isMobile ? 'w-full pb-16' : 'w-[380px] lg:w-[400px] flex-shrink-0'} border-r ${
                isDark ? 'border-[#27272A]' : 'border-[#E7E5E4]'
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
              className="flex-1 h-full overflow-hidden flex flex-col"
            >
              {selectedContact ? (
                <ChatWindow selectedContact={selectedContact} setSelectedContact={setSelectedContact} />
              ) : (
                /* Empty state */
                <div className={`h-full flex flex-col items-center justify-center text-center p-8 ${
                  isDark ? 'bg-[#09090B]' : 'bg-[#FAFAF9]'
                }`}>
                  <div className="w-20 h-20 accent-gradient rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-orange-500/15">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-extrabold mb-2 accent-gradient-text">Talkative</h3>
                  <p className={`text-sm max-w-xs leading-relaxed ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
                    Fast, secure messaging at your fingertips. Pick a conversation from the sidebar to begin.
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowThemeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`p-6 rounded-2xl shadow-2xl w-full max-w-sm border-2 ${
                isDark ? 'bg-[#18181B] text-[#FAFAFA] border-[#27272A]' : 'bg-white text-[#0C0A09] border-[#E7E5E4]'
              }`}
            >
              <h2 className="text-lg font-extrabold mb-1">Appearance</h2>
              <p className={`text-xs mb-5 ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>Choose your vibe</p>

              <div className="space-y-3">
                {['dark', 'light'].map((t) => (
                  <label key={t}
                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                      theme === t ? 'border-[#F97316] bg-[#F97316]/8' : isDark ? 'border-[#27272A] hover:border-[#3F3F46]' : 'border-[#E7E5E4] hover:border-[#D6D3D1]'
                    }`}
                  >
                    <input type="radio" name="theme" checked={theme === t} onChange={() => setTheme(t)} className="accent-[#F97316]" />
                    <div>
                      <p className="font-bold text-sm capitalize">{t} Mode</p>
                      <p className={`text-xs ${isDark ? 'text-[#71717A]' : 'text-[#A8A29E]'}`}>
                        {t === 'dark' ? 'Sleek dark interface' : 'Clean bright interface'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <button id="close-theme-modal" onClick={() => setShowThemeModal(false)}
                className="mt-5 w-full py-3 accent-gradient text-white font-bold text-sm rounded-2xl shadow-md shadow-orange-500/20 hover:brightness-110 transition-all"
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
