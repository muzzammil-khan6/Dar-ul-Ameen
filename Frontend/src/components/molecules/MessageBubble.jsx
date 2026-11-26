// Job: 1v1 Chat message bubble molecule with Text, Image, Time, and Status Ticks
import React, { memo } from "react";
import { Check, CheckCheck } from "lucide-react";

function MessageBubble({
  message,
  isMine = false,
  onImageClick,
  className = "",
}) {
  if (!message) return null;

  const timeStr = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} ${className}`}>
      <div
        className={`max-w-[78%] md:max-w-[65%] rounded-2xl p-3 shadow-xs space-y-1.5 ${
          isMine
            ? "bg-emerald-600 text-white rounded-br-xs"
            : "bg-slate-100 text-slate-800 rounded-bl-xs"
        }`}
      >
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="attachment"
            loading="lazy"
            decoding="async"
            onClick={() => onImageClick && onImageClick(message.imageUrl)}
            className="rounded-xl max-h-60 w-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
          />
        )}
        {message.message && (
          <p className="text-xs md:text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.message}
          </p>
        )}
        <div className={`flex items-center justify-end gap-1 text-[10px] ${isMine ? "text-emerald-100" : "text-slate-400"}`}>
          <span>{timeStr}</span>
          {isMine && (
            <span>
              {message.isSeen ? (
                <CheckCheck className="w-3.5 h-3.5 text-sky-300" title="Seen" />
              ) : message.isDelivered ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-200" title="Delivered" />
              ) : (
                <Check className="w-3.5 h-3.5 text-emerald-200" title="Sent" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
