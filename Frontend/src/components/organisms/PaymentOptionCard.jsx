// Job: Payment method selection option card organism (Wallet vs Manual transfer)
import React from "react";
import PriceText from "../atoms/PriceText";
import { Check } from "lucide-react";

export default function PaymentOptionCard({
  icon: Icon,
  title,
  subtitle,
  balance,
  isSelected = false,
  onClick,
  disabled = false,
  className = "",
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
        disabled
          ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
          : isSelected
          ? "border-emerald-600 bg-emerald-50/40 cursor-pointer shadow-xs"
          : "border-slate-200 bg-white hover:border-slate-300 cursor-pointer"
      } ${className}`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h4 className="text-xs md:text-sm font-bold text-slate-800">{title}</h4>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          {balance !== undefined && (
            <div className="text-xs text-slate-600 font-medium mt-1">
              Balance: <PriceText amount={balance} size="sm" />
            </div>
          )}
        </div>
      </div>

      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
        isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"
      }`}>
        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
      </div>
    </div>
  );
}
