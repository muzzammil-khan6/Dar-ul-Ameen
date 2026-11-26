// Job: Dynamic countdown timer display molecule ticking automatically via meet.service
import React, { useState, useEffect } from "react";
import { getCountdown, getSlotDateTime } from "../../services/meet.service";
import { Clock } from "lucide-react";

export default function CountdownDisplay({
  date,
  startTime,
  className = "",
  showIcon = true,
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  if (!date || !startTime) return null;

  const targetDate = getSlotDateTime(date, startTime);
  const countdown = getCountdown(targetDate, now);

  const isStarting = countdown === "Class starting now";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isStarting
          ? "bg-emerald-100 text-emerald-800 animate-pulse"
          : "bg-amber-50 text-amber-800 border border-amber-200"
      } ${className}`}
    >
      {showIcon && <Clock className="w-3.5 h-3.5 shrink-0" />}
      <span>{countdown}</span>
    </span>
  );
}
