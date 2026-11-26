// Job: Consistent currency and price text formatting (e.g. Rs. 2,500)
import React from "react";

export default function PriceText({
  amount = 0,
  currency = "Rs.",
  className = "",
  size = "md", // sm | md | lg | xl
}) {
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  const formatted = num.toLocaleString("en-PK");

  const sizeClasses = {
    sm: "text-xs font-semibold",
    md: "text-sm font-bold",
    lg: "text-lg font-extrabold",
    xl: "text-2xl font-black",
  };

  return (
    <span className={`inline-flex items-baseline gap-1 text-slate-900 ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      <span className="text-[0.75em] text-slate-500 font-semibold">{currency}</span>
      <span>{formatted}</span>
    </span>
  );
}
