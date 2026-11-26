// Job: Active 1v1 chat window header organism with partner info, online presence, and actions menu
import React, { useState } from "react";
import Avatar from "../atoms/Avatar";
import OnlineDot from "../atoms/OnlineDot";
import IconButton from "../atoms/IconButton";
import { ArrowLeft, MoreVertical, VolumeX, Volume2, ShieldAlert } from "lucide-react";

export default function ChatHeader({
  partner,
  isOnline = false,
  isTyping = false,
  isMuted = false,
  isBlocked = false,
  onBack,
  onToggleMute,
  onToggleBlock,
  className = "",
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!partner) return null;

  return (
    <div className={`p-3 md:p-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 relative ${className}`}>
      <div className="flex items-center gap-3">
        {onBack && (
          <IconButton onClick={onBack} title="Back to conversations" size="sm" className="md:hidden">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </IconButton>
        )}
        <div className="relative shrink-0">
          <Avatar src={partner.picture} size="md" />
          <span className="absolute bottom-0 right-0">
            <OnlineDot isOnline={isOnline} size="sm" />
          </span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 leading-tight">{partner.fullName}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isTyping ? (
              <span className="text-emerald-600 font-semibold animate-pulse">typing...</span>
            ) : isOnline ? (
              <span className="text-emerald-600 font-medium">Online</span>
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>

      {/* Options Menu */}
      <div className="relative">
        <IconButton onClick={() => setMenuOpen(!menuOpen)} title="Options" size="sm">
          <MoreVertical className="w-4 h-4 text-slate-600" />
        </IconButton>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-xs">
            {onToggleMute && (
              <button
                type="button"
                onClick={() => {
                  onToggleMute();
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                {isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                {isMuted ? "Unmute Notifications" : "Mute Notifications"}
              </button>
            )}
            {onToggleBlock && (
              <button
                type="button"
                onClick={() => {
                  onToggleBlock();
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                {isBlocked ? "Unblock User" : "Block User"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
