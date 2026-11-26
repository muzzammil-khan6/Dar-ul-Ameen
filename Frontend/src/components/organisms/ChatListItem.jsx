// Job: 1v1 conversation list item organism with Avatar, OnlineDot, Name, LastMessage preview, Time, and Unread badge
import React, { memo } from "react";
import Avatar from "../atoms/Avatar";
import OnlineDot from "../atoms/OnlineDot";

function ChatListItem({
  chat,
  isSelected = false,
  onClick,
  className = "",
}) {
  if (!chat) return null;
  const partner = chat.user;
  const hasUnread = (chat.unreadCount || 0) > 0;

  const timeStr = chat.lastMessage?.createdAt || chat.updatedAt
    ? new Date(chat.lastMessage?.createdAt || chat.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 cursor-pointer transition-all border-b border-slate-100 hover:bg-slate-50 ${
        isSelected ? "bg-emerald-50/70 border-l-4 border-emerald-600" : ""
      } ${className}`}
    >
      <div className="relative shrink-0">
        <Avatar src={partner?.picture} size="md" />
        <span className="absolute bottom-0 right-0">
          <OnlineDot isOnline={chat.isOnline} size="sm" />
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`text-xs truncate ${hasUnread ? "font-extrabold text-slate-900" : "font-semibold text-slate-800"}`}>
            {partner?.fullName || "User"}
          </h4>
          <span className="text-[10px] text-slate-400 shrink-0 ml-1">{timeStr}</span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className={`text-[11px] truncate pr-2 ${hasUnread ? "font-bold text-slate-900" : "text-slate-500"}`}>
            {chat.lastMessage
              ? chat.lastMessage.imageUrl
                ? "📷 Photo"
                : chat.lastMessage.message
              : "No messages yet"}
          </p>
          {hasUnread && (
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ChatListItem);
