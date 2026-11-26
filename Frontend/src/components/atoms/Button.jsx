// Job: Smallest reusable button atom with variant styling and loading state
import React, { memo } from "react";
import Spinner from "./Spinner";

function Button({
  children,
  variant = "primary", // primary | cta | amber | secondary | outline | danger | ghost | dark
  size = "md", // sm | md | lg
  isLoading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const base = "inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs md:text-sm gap-2",
    lg: "px-5 py-2.5 text-sm md:text-base gap-2.5",
  };

  const variants = {
    primary: "bg-primary hover:bg-primaryDark text-white shadow-xs",
    cta: "bg-amber hover:bg-amberDark text-charcoal font-bold shadow-xs",
    amber: "bg-amber hover:bg-amberDark text-charcoal font-bold shadow-xs",
    secondary: "bg-white border border-border text-charcoal hover:bg-sage/50 shadow-2xs",
    outline: "border border-border bg-white text-charcoal hover:bg-sage/50",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs",
    ghost: "bg-transparent hover:bg-sage text-muted hover:text-charcoal",
    dark: "bg-charcoal hover:bg-slate-800 text-white shadow-xs",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${base} ${sizeClasses[size] || sizeClasses.md} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

export default memo(Button);
