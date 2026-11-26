// Job: Key-value pricing row molecule combining Label + PriceText
import React from "react";
import PriceText from "../atoms/PriceText";

export default function PriceRow({
  label,
  amount,
  size = "md",
  isTotal = false,
  className = "",
}) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${
        isTotal ? "border-t border-slate-200 pt-2 font-bold" : "text-slate-600"
      } ${className}`}
    >
      <span className={`text-xs ${isTotal ? "text-slate-900 font-bold" : "text-slate-500"}`}>
        {label}
      </span>
      <PriceText amount={amount} size={size} className={isTotal ? "text-emerald-700" : ""} />
    </div>
  );
}
