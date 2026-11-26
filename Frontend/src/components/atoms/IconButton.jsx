// Job: Compact circular or rounded icon-only button atom
import React from "react";
import Spinner from "./Spinner";

export default function IconButton({
  children,
  onClick,
  title,
  variant = "ghost", // ghost | primary | secondary | outline | danger
  size = "md", // sm | md | lg
  isLoading = false,
  disabled = false,
  className = "",
  type = "button",
  ...props
}) {
  const sizeMap = {
    sm: "w-7 h-7 p-1 text-xs",
    md: "w-9 h-9 p-2 text-sm",
    lg: "w-11 h-11 p-2.5 text-base",
  };

  const variants = {
    ghost: "text-slate-500 hover:text-slate-800 hover:bg-slate-100",
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    outline: "border border-slate-200 hover:bg-slate-50 text-slate-600",
    danger: "text-rose-500 hover:bg-rose-50 hover:text-rose-700",
  };

  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeMap[size] || sizeMap.md} ${variants[variant] || variants.ghost} ${className}`}
      {...props}
    >
      {isLoading ? <Spinner size="sm" /> : children}
    </button>
  );
}
