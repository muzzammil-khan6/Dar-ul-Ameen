// Job: General purpose chip/badge atom with color variants
import React from "react";

export default function Badge({
  children,
  variant = "slate", // emerald | amber | sky | rose | purple | slate
  size = "md", // sm | md
  className = "",
}) {
  const variants = {
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    sky: "bg-sky-50 text-sky-800 border-sky-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
    purple: "bg-purple-50 text-purple-800 border-purple-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-[9px]",
    md: "px-2 py-0.5 text-[10px]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-md border ${
        variants[variant] || variants.slate
      } ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
}
