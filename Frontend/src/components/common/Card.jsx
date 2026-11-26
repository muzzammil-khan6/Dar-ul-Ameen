import React from "react";

export default function Card({
  children,
  className = "",
  padding = "p-6",
  hover = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-border rounded-xl shadow-xs ${padding} ${
        hover ? "hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
