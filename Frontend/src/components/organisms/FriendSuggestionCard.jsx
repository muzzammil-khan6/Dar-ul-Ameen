// Job: 1v1 People You May Know suggestion card organism with location, phone, reason badge, and friend action buttons
import React, { memo } from "react";
import Avatar from "../atoms/Avatar";
import Button from "../atoms/Button";
import Badge from "../atoms/Badge";
import { UserPlus, UserCheck, MessageSquare, MapPin, Phone, Sparkles, Mail } from "lucide-react";

function FriendSuggestionCard({
  item,
  onAddFriend,
  onAcceptRequest,
  onOpenChat,
  isLoading = false,
  className = "",
}) {
  if (!item?.user) return null;
  const u = item.user;
  const locationText = u.city && u.country ? `${u.city}, ${u.country}` : u.city || u.country || "";
  const isPhoneReason = item.reason?.toLowerCase().includes("phone");
  const isLocationReason =
    item.reason?.toLowerCase().includes("city") ||
    item.reason?.toLowerCase().includes("country") ||
    item.reason?.toLowerCase().includes("from");

  return (
    <div className={`p-3.5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all ${className}`}>
      <div className="flex items-start gap-3">
        <Avatar src={u.picture} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-xs text-slate-900 truncate">{u.fullName}</h4>
            <span className="text-[9px] uppercase px-1 py-0.2 bg-slate-100 text-slate-600 rounded font-medium shrink-0">
              {Array.isArray(u.role) ? u.role[0] : u.role}
            </span>
          </div>

          {locationText && (
            <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0 inline" />
              <span className="truncate">{locationText}</span>
            </p>
          )}

          {u.phone && (
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5 font-mono">
              <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0 inline" />
              <span className="truncate">{u.phone}</span>
            </p>
          )}
        </div>
      </div>

      {/* Reason Badge */}
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border max-w-full truncate ${
          isPhoneReason
            ? "bg-amber-50 text-amber-800 border-amber-200"
            : isLocationReason
            ? "bg-sky-50 text-sky-800 border-sky-200"
            : "bg-emerald-50 text-emerald-800 border-emerald-100"
        }`}
      >
        {isPhoneReason ? (
          <Phone className="w-2.5 h-2.5 shrink-0" />
        ) : isLocationReason ? (
          <MapPin className="w-2.5 h-2.5 shrink-0" />
        ) : (
          <Sparkles className="w-2.5 h-2.5 shrink-0" />
        )}
        <span className="truncate">{item.reason}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
        {item.requestSent || item.connectionStatus === "pending_sent" ? (
          <span className="flex-1 text-center py-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 rounded-xl">
            Request Sent
          </span>
        ) : item.connectionStatus === "pending_received" ? (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onAcceptRequest?.(item.friendshipId)}
            isLoading={isLoading}
            className="flex-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Accept
          </Button>
        ) : (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onAddFriend?.(u._id)}
            isLoading={isLoading}
            className="flex-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Friend
          </Button>
        )}

        {onOpenChat && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenChat(u)}
            className="px-2.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default memo(FriendSuggestionCard);
