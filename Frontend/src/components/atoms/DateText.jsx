// Job: Formatted date text atom with calendar icon
import React from "react";
import { Calendar } from "lucide-react";

export default function DateText({
  date,
  showIcon = true,
  format = "short", // short: 15 Nov 2026 | long: Sunday, 15 Nov 2026
  className = "",
}) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return <span className={className}>{String(date)}</span>;

  const formatted =
    format === "long"
      ? d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
      : d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  return (
    <span className={`inline-flex items-center gap-1 text-xs text-slate-600 font-medium ${className}`}>
      {showIcon && <Calendar className="w-3 h-3 text-slate-400 shrink-0" />}
      <span>{formatted}</span>
    </span>
  );
}
