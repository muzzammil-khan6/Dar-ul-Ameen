// Job: User profile card molecule combining Avatar + Name + City + Action Button
import React, { memo } from "react";
import Avatar from "../atoms/Avatar";
import Button from "../atoms/Button";
import { MapPin } from "lucide-react";

function UserCard({
  user,
  actionLabel = "View",
  onAction,
  className = "",
}) {
  if (!user) return null;
  const role = Array.isArray(user.role) ? user.role[0] : user.role || "student";
  const location = user.city && user.country ? `${user.city}, ${user.country}` : user.city || user.country;

  return (
    <div className={`p-4 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Avatar src={user.picture} size="lg" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-800 truncate">{user.fullName}</h4>
          <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            {role}
          </span>
          {location && (
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          )}
        </div>
      </div>
      {onAction && (
        <Button size="sm" variant="outline" onClick={onAction} className="w-full">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default memo(UserCard);
