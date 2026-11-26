// Job: User row molecule combining Avatar + Name + OnlineDot / Subtitle
import React, { memo } from "react";
import Avatar from "../atoms/Avatar";
import OnlineDot from "../atoms/OnlineDot";

function UserRow({
  user,
  subtitle = "",
  isOnline = false,
  showDot = false,
  action,
  onClick,
  className = "",
}) {
  if (!user) return null;
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
        onClick ? "cursor-pointer hover:bg-slate-50" : ""
      } ${className}`}
    >
      <div className="relative shrink-0">
        <Avatar src={user.picture} alt={user.fullName || "User"} size="md" />
        {showDot && (
          <span className="absolute bottom-0 right-0">
            <OnlineDot isOnline={isOnline} size="sm" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-slate-800 truncate">
          {user.fullName || "Unnamed User"}
        </h4>
        {subtitle && (
          <p className="text-[11px] text-slate-500 truncate mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export default memo(UserRow);
