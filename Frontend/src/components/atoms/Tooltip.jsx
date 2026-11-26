// Job: Simple hover tooltip atom
import React, { useState } from "react";

export default function Tooltip({ text, children, position = "top", className = "" }) {
  const [show, setShow] = useState(false);

  const posClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <span
          className={`absolute z-30 whitespace-nowrap px-2 py-1 text-[10px] font-medium text-white bg-slate-900 rounded-md shadow-md pointer-events-none transition-opacity ${
            posClasses[position] || posClasses.top
          }`}
        >
          {text}
        </span>
      )}
    </div>
  );
}
