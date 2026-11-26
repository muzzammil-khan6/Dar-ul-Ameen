// Job: Join Meet button molecule with real-time class timing logic via meet.service
import React, { useState, useEffect } from "react";
import Button from "../atoms/Button";
import { getMeetTiming } from "../../services/meet.service";
import { Video } from "lucide-react";

export default function MeetLinkButton({
  meetLink,
  date,
  startTime,
  endTime,
  size = "sm",
  variant = "primary",
  label = "Join Meet",
  alwaysShow = false, // if true, bypass timing check when link exists
  className = "",
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  if (!meetLink) return null;

  if (!alwaysShow && date && startTime && endTime) {
    const timing = getMeetTiming(date, startTime, endTime, now);
    if (!timing.isLive) return null;
  }

  return (
    <a
      href={meetLink}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block"
    >
      <Button
        size={size}
        variant={variant}
        className={`bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse ${className}`}
      >
        <Video className="w-3.5 h-3.5 mr-1.5" />
        {label}
      </Button>
    </a>
  );
}
