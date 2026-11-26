// Job: Notification list item molecule combining Icon/Avatar + Text + Relative Time
import React from "react";
import Avatar from "../atoms/Avatar";
import { Bell } from "lucide-react";

export default function NotificationItem({
  notification,
  onRead,
  className = "",
}) {
  if (!notification) return null;
  const isUnread = !notification.isRead;

  return (
    <div
      onClick={onRead}
      className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
        isUnread ? "bg-emerald-50/50 border-l-4 border-emerald-600" : "bg-white hover:bg-slate-50"
      } ${className}`}
    >
      {notification.sender?.picture ? (
        <Avatar src={notification.sender.picture} size="sm" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-xs ${isUnread ? "font-bold text-slate-900" : "text-slate-700"}`}>
          {notification.message || notification.text}
        </p>
        <span className="text-[10px] text-slate-400 mt-0.5 block">
          {notification.createdAt ? new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
        </span>
      </div>
    </div>
  );
}
