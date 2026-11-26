// Job: Presence indicator dot atom (Green online / Grey offline)
import React from "react";

export default function OnlineDot({ isOnline = false, size = "md", className = "" }) {
  const sizeMap = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
  };

  return (
    <span
      className={`rounded-full border-2 border-white shrink-0 ${sizeMap[size] || sizeMap.md} ${
        isOnline ? "bg-emerald-500" : "bg-slate-300"
      } ${className}`}
      title={isOnline ? "Online" : "Offline"}
    />
  );
}
