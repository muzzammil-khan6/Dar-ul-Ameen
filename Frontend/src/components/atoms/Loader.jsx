// Job: Loading indicator box with spinner and label
import React from "react";
import Spinner from "./Spinner";

export default function Loader({ text = "Loading...", size = "md", className = "" }) {
  return (
    <div className={`py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-500 ${className}`}>
      <Spinner size={size} className="text-emerald-600" />
      {text && <span>{text}</span>}
    </div>
  );
}
