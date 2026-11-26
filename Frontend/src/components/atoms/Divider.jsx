// Job: Subtle horizontal or vertical separator atom
import React from "react";

export default function Divider({
  orientation = "horizontal", // horizontal | vertical
  className = "",
}) {
  if (orientation === "vertical") {
    return <div className={`w-px h-full bg-slate-200 shrink-0 ${className}`} />;
  }
  return <div className={`w-full h-px bg-slate-200 shrink-0 ${className}`} />;
}
