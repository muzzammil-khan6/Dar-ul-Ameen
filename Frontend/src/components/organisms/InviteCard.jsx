// Job: Invite & Earn dashboard card organism highlighting referral rewards and quick modal trigger
import React from "react";
import Button from "../atoms/Button";
import PriceText from "../atoms/PriceText";
import { Gift, ArrowRight, Users } from "lucide-react";

export default function InviteCard({
  totalEarned = 0,
  totalJoined = 0,
  onOpenInvite,
  className = "",
}) {
  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md shadow-emerald-700/15 flex flex-col justify-between space-y-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
          <Gift className="w-5 h-5 text-amber-300" />
        </div>
        <div className="text-right">
          <span className="text-[10px] text-emerald-100 uppercase font-bold tracking-wider">Reward Bonus</span>
          <PriceText amount={100} size="md" className="text-white block" />
        </div>
      </div>

      <div>
        <h3 className="text-sm md:text-base font-extrabold">Invite Friends & Earn</h3>
        <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
          Share your referral link with classmates. Earn Rs. 100 wallet credit on their first completed paid class!
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/15">
        <span className="text-xs text-emerald-100 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-amber-300" />
          <span><strong>{totalJoined}</strong> friends joined</span>
        </span>
        <Button
          size="sm"
          variant="dark"
          onClick={onOpenInvite}
          className="bg-gray-800 text-white hover:bg-gray-900 shadow-none font-bold"
        >
          Invite Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
