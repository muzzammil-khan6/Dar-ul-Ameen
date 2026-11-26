// Job: Wallet overview card organism displaying balance, summary statistics, and top up/withdraw triggers
import React from "react";
import WalletBalanceCard from "../molecules/WalletBalanceCard";
import PriceText from "../atoms/PriceText";
import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";

export default function WalletCard({
  balance = 0,
  totalCredited = 0,
  totalSpent = 0,
  pending = 0,
  onTopUp,
  onWithdraw,
  isTeacher = false,
  className = "",
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary Balance Card */}
      <WalletBalanceCard
        balance={balance}
        label={isTeacher ? "Teacher Earnings Balance" : "Student Wallet Balance"}
        buttonText={isTeacher ? "Withdraw Earnings" : "Top Up Wallet"}
        onButtonClick={isTeacher ? onWithdraw : onTopUp}
        variant={isTeacher ? "teacher" : "primary"}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            {isTeacher ? "Total Earned" : "Total Credited"}
          </span>
          <PriceText amount={totalCredited} size="md" className="mt-1 block text-slate-800" />
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
            {isTeacher ? "Total Withdrawn" : "Total Spent"}
          </span>
          <PriceText amount={totalSpent} size="md" className="mt-1 block text-slate-800" />
        </div>

        {pending > 0 && (
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[11px] text-amber-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Pending Processing
            </span>
            <PriceText amount={pending} size="md" className="mt-1 block text-amber-800" />
          </div>
        )}
      </div>
    </div>
  );
}
