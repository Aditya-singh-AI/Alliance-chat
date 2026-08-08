import React, { useState } from "react";
import { format } from "date-fns";
import {
  IoCall,
  IoVideocam,
  IoSearch,
  IoTrashOutline,
  IoCallOutline,
  IoArrowDown,
  IoArrowUp
} from "react-icons/io5";
import useVideoCallStore from "../../store/useVideoCallStore";
import { useThemeStore } from "../../store/useThemeStore";
const Calls = () => {
  const { theme } = useThemeStore();
  const { callHistory, clearCallHistory } = useVideoCallStore();
  const [searchQuery, setSearchQuery] = useState("");

  const isDark = theme === "dark";

  const filteredHistory = callHistory.filter((call) =>
    (call.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInitiateCall = (contactId, name, avatar, type) => {
    const initCall = useVideoCallStore.getState().initiateCall;
    if (initCall && contactId) {
      initCall(contactId, name, avatar, type);
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden select-none ${isDark ? "bg-[#09090B] text-[#FAFAFA]" : "bg-[#FAFAF9] text-[#0C0A09]"}`}>
      {/* Sticky Header */}
      <div className={`sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b backdrop-blur-xl ${
        isDark ? "bg-[#18181B]/95 border-[#27272A]" : "bg-white/95 border-[#E7E5E4] shadow-sm"
      }`}>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight accent-gradient-text">Calls</h1>
          <p className={`text-xs font-medium ${isDark ? "text-[#71717A]" : "text-[#A8A29E]"}`}>
            {callHistory.length} recent {callHistory.length === 1 ? "call" : "calls"}
          </p>
        </div>

        {callHistory.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to clear your call history?")) {
                clearCallHistory();
              }
            }}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"
            }`}
            title="Clear Call Log"
          >
            <IoTrashOutline className="w-4 h-4" />
            <span className="hidden sm:inline">Clear Log</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
        {/* Search Bar */}
        {callHistory.length > 0 && (
          <div className="relative">
            <IoSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-[#71717A]" : "text-[#A8A29E]"}`} />
            <input
              type="text"
              placeholder="Search call logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 ${
                isDark ? "bg-[#18181B] border-[#27272A] text-white placeholder-[#71717A]" : "bg-white border-[#E7E5E4] text-[#0C0A09] placeholder-[#A8A29E]"
              }`}
            />
          </div>
        )}

        {/* Call History List */}
        {filteredHistory.length > 0 ? (
          <div className="space-y-2">
            {filteredHistory.map((call) => {
              const isMissed = call.direction === "missed" || call.status === "rejected" || call.status === "missed";
              const isIncoming = call.direction === "incoming";
              const callDate = call.timestamp ? format(new Date(call.timestamp), "MMM dd, HH:mm") : "Recently";

              return (
                <div
                  key={call.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isDark
                      ? "bg-[#18181B]/60 border-[#27272A] hover:bg-[#18181B]"
                      : "bg-white border-[#E7E5E4] hover:shadow-md"
                  }`}
                >
                  {/* Contact Info */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <img
                        src={call.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.contactId || call.name}`}
                        alt={call.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-[#27272A]"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        isMissed ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                      }`}>
                        {isIncoming || call.direction === "missed" ? (
                          <IoArrowDown className="w-3 h-3" />
                        ) : (
                          <IoArrowUp className="w-3 h-3" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-sm truncate">{call.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[11px] font-bold flex items-center gap-1 ${
                          isMissed ? "text-red-500" : isDark ? "text-[#71717A]" : "text-[#A8A29E]"
                        }`}>
                          {isMissed ? "Missed call" : isIncoming ? "Incoming" : "Outgoing"}
                        </span>
                        <span className="text-[10px] text-gray-500">•</span>
                        <span className={`text-[11px] font-medium ${isDark ? "text-[#71717A]" : "text-[#A8A29E]"}`}>
                          {callDate}
                        </span>
                        {call.duration && call.duration !== "00:00" && (
                          <>
                            <span className="text-[10px] text-gray-500">•</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F97316]/10 text-[#F97316]">
                              {call.duration}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Call Back Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleInitiateCall(call.contactId, call.name, call.avatar, "audio")}
                      className={`p-2.5 rounded-xl transition-all ${
                        isDark
                          ? "bg-[#27272A] text-[#FAFAFA] hover:bg-emerald-500 hover:text-white"
                          : "bg-[#F5F5F4] text-[#0C0A09] hover:bg-emerald-500 hover:text-white"
                      }`}
                      title="Voice Call"
                    >
                      <IoCall className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleInitiateCall(call.contactId, call.name, call.avatar, "video")}
                      className={`p-2.5 rounded-xl transition-all ${
                        isDark
                          ? "bg-[#27272A] text-[#FAFAFA] hover:bg-[#F97316] hover:text-white"
                          : "bg-[#F5F5F4] text-[#0C0A09] hover:bg-[#F97316] hover:text-white"
                      }`}
                      title="Video Call"
                    >
                      <IoVideocam className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-20 h-20 accent-gradient rounded-3xl flex items-center justify-center mb-4 shadow-xl shadow-orange-500/20">
              <IoCallOutline className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-extrabold mb-1">No Recent Calls</h3>
            <p className={`text-xs max-w-xs leading-relaxed ${isDark ? "text-[#71717A]" : "text-[#A8A29E]"}`}>
              Calls you make and receive will show up here. Select a contact from your chat list to start a voice or video call!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calls;
