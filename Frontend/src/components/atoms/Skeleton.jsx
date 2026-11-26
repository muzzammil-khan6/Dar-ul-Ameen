// Job: UI loading placeholder skeleton atom with pulse animation
import React, { memo } from "react";

function Skeleton({ className = "h-4 w-full rounded-md", ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 ${className}`}
      {...props}
    />
  );
}

export default memo(Skeleton);
