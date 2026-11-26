// Job: Form text/number input atom with error and sizing states
import React from "react";

export default function Input({
  type = "text",
  value,
  onChange,
  placeholder = "",
  disabled = false,
  error = false,
  className = "",
  ...props
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3.5 py-2 text-xs md:text-sm rounded-xl border transition-all outline-none disabled:bg-sage/40 disabled:cursor-not-allowed ${
        error
          ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
          : "border-border bg-white text-charcoal placeholder-muted/60 focus:border-primary focus:ring-1 focus:ring-primary"
      } ${className}`}
      {...props}
    />
  );
}
