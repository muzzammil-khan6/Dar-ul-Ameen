// Job: Formatted slot and class timing text atom with clock icon
import React from "react";
import { Clock } from "lucide-react";

export default function TimeText({
  startTime,
  endTime,
  showIcon = true,
  className = "",
}) {
  const display = startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || "";
  if (!display) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-xs text-slate-600 font-medium ${className}`}>
      {showIcon && <Clock className="w-3 h-3 text-slate-400 shrink-0" />}
      <span>{display}</span>
    </span>
  );
}
