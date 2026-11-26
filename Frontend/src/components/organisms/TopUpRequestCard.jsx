// Job: Admin wallet top-up request review card organism with receipt preview and approval actions
import React, { memo } from "react";
import PriceText from "../atoms/PriceText";
import StatusBadge from "../atoms/StatusBadge";
import DateText from "../atoms/DateText";
import Avatar from "../atoms/Avatar";
import Button from "../atoms/Button";
import { Check, X, ExternalLink, Wallet } from "lucide-react";

function TopUpRequestCard({
  request,
  onApprove,
  onReject,
  isLoading = false,
  className = "",
}) {
  if (!request) return null;
  const isPending = request.status === "pending" || request.status === "pending_admin";
  const user = request.student || request.user;
  const receiptImg = request.screenshot || request.receipt || request.paymentProof;

  return (
    <div className={`p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={user?.picture} size="md" />
          <div>
            <h4 className="text-xs font-bold text-slate-800">{user?.fullName}</h4>
            <span className="text-[10px] text-slate-400 capitalize">{user?.role || "Student"}</span>
          </div>
        </div>
        <div className="text-right">
          <PriceText amount={request.amount} size="lg" className="text-emerald-700 block" />
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500">Method:</span>
          <span className="font-semibold text-slate-800 uppercase">{request.paymentMethod || request.method || "Manual"}</span>
        </div>
        {request.transactionId && (
          <div className="flex justify-between">
            <span className="text-slate-500">Transaction ID:</span>
            <span className="font-mono font-bold text-slate-800">{request.transactionId}</span>
          </div>
        )}
        {receiptImg && (
          <a
            href={receiptImg}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 font-semibold inline-flex items-center gap-1 hover:underline pt-1"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Payment Proof
          </a>
        )}
      </div>

      {isPending && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button size="sm" variant="outline" onClick={() => onReject?.(request._id)} disabled={isLoading}>
            <X className="w-3.5 h-3.5 mr-1 text-rose-500" /> Reject
          </Button>
          <Button size="sm" variant="primary" onClick={() => onApprove?.(request._id)} isLoading={isLoading}>
            <Check className="w-3.5 h-3.5 mr-1" /> Approve & Credit Wallet
          </Button>
        </div>
      )}
    </div>
  );
}

export default memo(TopUpRequestCard);
