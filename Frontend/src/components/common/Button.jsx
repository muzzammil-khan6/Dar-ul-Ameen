import React, { memo } from "react";

function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const variantStyles = {
    primary:
      "bg-primary hover:bg-primaryDark text-white focus:ring-primary shadow-xs",
    cta:
      "bg-amber hover:bg-amberDark text-charcoal font-bold focus:ring-amber shadow-xs",
    amber:
      "bg-amber hover:bg-amberDark text-charcoal font-bold focus:ring-amber shadow-xs",
    secondary:
      "bg-white border border-border text-charcoal hover:bg-sage/50 focus:ring-slate-400 shadow-2xs",
    danger:
      "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-xs",
    outline:
      "border border-border bg-white text-charcoal hover:bg-sage/50 focus:ring-primary",
    ghost: "text-muted hover:bg-sage hover:text-charcoal focus:ring-slate-300",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default memo(Button);
