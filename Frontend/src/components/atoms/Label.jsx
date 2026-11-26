// Job: Accessible form label atom with required asterisk
import React from "react";

export default function Label({
  children,
  htmlFor,
  required = false,
  className = "",
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-semibold text-slate-700 mb-1.5 ${className}`}
    >
      {children}
      {required && <span className="text-rose-500 ml-1">*</span>}
    </label>
  );
}
