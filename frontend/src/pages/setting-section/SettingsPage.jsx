import React, { useState } from "react";
import { IoSearch, IoPersonOutline, IoChatbubbleEllipsesOutline, IoNotificationsOutline, IoMoonOutline, IoSunnyOutline, IoLogOutOutline } from "react-icons/io5";
import { useUserStore } from "../../store/useUserStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useChatStore } from "../../store/useChatStore";
import axiosInstance from "../../services/url.service";

const SettingsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const cleanUpChatStore = useChatStore((state) => state.cleanUp);

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.get("/auth/logout");
      clearUser();
      cleanUpChatStore();
      window.location.href = "/login";
    } catch (err) {
      console.error("Failed to safely log out:", err);
      clearUser();
      cleanUpChatStore();
      window.location.href = "/login";
    }
  };

  const menuItems = [
    { label: "Account", icon: IoPersonOutline, action: () => {} },
    { label: "Chats", icon: IoChatbubbleEllipsesOutline, action: () => {} },
    { label: "Notifications", icon: IoNotificationsOutline, action: () => {} },
  ];

  return (
    <div className={`w-full h-screen border-r flex flex-col select-none ${
      isDark ? "bg-[#111b21] border-[#202c33] text-[#e9edef]" : "bg-white border-gray-200 text-gray-900"
    }`}>
      {/* Title */}
      <div className={`px-4 py-3.5 border-b ${isDark ? "border-[#202c33]" : "border-gray-100"}`}>
        <h2 className="text-xl font-bold tracking-tight">Settings</h2>
      </div>

      {/* Search Bar */}
      <div className={`p-3 border-b ${isDark ? "border-[#202c33]" : "border-gray-100"}`}>
        <div className="relative flex items-center">
          <IoSearch className={`absolute left-3.5 text-sm ${isDark ? "text-[#8696a0]" : "text-gray-400"}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings"
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-colors ${
              isDark
                ? "bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] focus:bg-[#2a3942]"
                : "bg-[#f0f2f5] text-gray-900 placeholder-gray-500 focus:bg-gray-200/80"
            }`}
          />
        </div>
      </div>

      {/* User Card Profile */}
      <div className={`p-4 flex items-center gap-4 border-b ${isDark ? "border-[#202c33]" : "border-gray-100"}`}>
        <img
          src={user?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id || 'default'}`}
          alt="User Profile"
          className="w-14 h-14 rounded-full object-cover border-2 border-[#00a884]"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{user?.username}</h3>
          <p className={`text-xs truncate ${isDark ? "text-[#8696a0]" : "text-gray-500"}`}>
            {user?.about || "Hey there! I am using Alliance."}
          </p>
        </div>
      </div>

      {/* Menu Settings Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3.5 p-3 rounded-xl text-left transition-colors text-sm font-medium ${
                isDark ? "hover:bg-[#202c33] text-[#e9edef]" : "hover:bg-gray-100 text-gray-800"
              }`}
            >
              <Icon className="w-5 h-5 text-[#00a884]" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`w-full flex justify-between items-center p-3 rounded-xl transition-colors text-sm font-medium ${
            isDark ? "hover:bg-[#202c33] text-[#e9edef]" : "hover:bg-gray-100 text-gray-800"
          }`}
        >
          <div className="flex items-center gap-3.5">
            {isDark ? (
              <IoMoonOutline className="w-5 h-5 text-[#00a884]" />
            ) : (
              <IoSunnyOutline className="w-5 h-5 text-[#00a884]" />
            )}
            <span>Theme Mode</span>
          </div>
          <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
            isDark ? "bg-[#202c33] text-[#00a884]" : "bg-gray-200 text-gray-700"
          }`}>
            {theme}
          </span>
        </button>
      </div>

      {/* Log Out Footer */}
      <div className={`p-4 border-t ${isDark ? "border-[#202c33]" : "border-gray-100"}`}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-semibold rounded-xl transition-colors text-sm"
        >
          <IoLogOutOutline className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
