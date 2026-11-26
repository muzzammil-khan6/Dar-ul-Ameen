// Job: Pure SVG loading spinner icon atom
import React from "react";
import { Loader2 } from "lucide-react";

export default function Spinner({ size = "md", className = "" }) {
  const sizeMap = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };
  return (
    <Loader2
      className={`animate-spin text-current shrink-0 ${sizeMap[size] || sizeMap.md} ${className}`}
    />
  );
}
