// Job: Facebook Messenger style 2-column layout template: Left ChatList + Right ChatWindow
import React from "react";

export default function ChatLayout({
  sidebar,
  chatWindow,
  hasActiveChat = false,
  className = "",
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex h-[760px] max-h-[calc(100vh-140px)] min-h-[580px] font-sans ${className}`}>
      {/* Left Column: List & Suggestions */}
      <div
        className={`${
          hasActiveChat ? "hidden md:flex" : "flex"
        } w-full md:w-72 lg:w-80 flex-col bg-white border-r border-slate-200 h-full shrink-0 select-none overflow-hidden`}
      >
        {sidebar}
      </div>

      {/* Right Column: Chat Window */}
      <div
        className={`${
          !hasActiveChat ? "hidden md:flex" : "flex"
        } flex-1 flex-col h-full bg-slate-50/50 min-w-0 overflow-hidden`}
      >
        {chatWindow}
      </div>
    </div>
  );
}
