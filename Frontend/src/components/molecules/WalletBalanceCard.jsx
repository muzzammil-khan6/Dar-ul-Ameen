// Job: Wallet balance molecule displaying current balance, label, and top up/withdraw button
import React, { memo } from "react";
import PriceText from "../atoms/PriceText";
import Button from "../atoms/Button";
import { Wallet, Plus, ArrowUpRight } from "lucide-react";

function WalletBalanceCard({
  balance = 0,
  label = "Available Balance",
  buttonText = "Top Up Wallet",
  onButtonClick,
  variant = "primary", // primary | teacher
  className = "",
}) {
  return (
    <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
      variant === "primary"
        ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500 shadow-md shadow-emerald-700/20"
        : "bg-white border-slate-200 text-slate-800"
    } ${className}`}>
      <div className="flex items-center gap-3.5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          variant === "primary" ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-600"
        }`}>
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <span className={`text-xs font-medium block ${variant === "primary" ? "text-emerald-100" : "text-slate-500"}`}>
            {label}
          </span>
          <PriceText
            amount={balance}
            size="xl"
            currency="Rs."
            className={variant === "primary" ? "text-white" : "text-slate-900"}
          />
        </div>
      </div>

      {onButtonClick && (
        <Button
          onClick={onButtonClick}
          variant={variant === "primary" ? "dark" : "primary"}
          size="md"
          className="shrink-0"
        >
          {variant === "primary" ? <Plus className="w-4 h-4 mr-1.5" /> : <ArrowUpRight className="w-4 h-4 mr-1.5" />}
          {buttonText}
        </Button>
      )}
    </div>
  );
}

export default memo(WalletBalanceCard);
