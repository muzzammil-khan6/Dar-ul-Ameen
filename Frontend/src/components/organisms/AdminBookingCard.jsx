// Job: Admin booking and payment review card organism with payment proof preview and approval actions
import React, { memo } from "react";
import StatusBadge from "../atoms/StatusBadge";
import PriceText from "../atoms/PriceText";
import DateText from "../atoms/DateText";
import TimeText from "../atoms/TimeText";
import Avatar from "../atoms/Avatar";
import Button from "../atoms/Button";
import { Check, X, ExternalLink } from "lucide-react";

function AdminBookingCard({
  booking,
  onApprove,
  onReject,
  isLoading = false,
  className = "",
}) {
  if (!booking) return null;
  const isWaiting =
    booking.status === "waiting_admin" ||
    booking.status === "pending_admin" ||
    booking.status === "payment_done, waiting_for_admin";
  const price = booking.totalPrice || booking.rate || 0;

  return (
    <div className={`p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <span className="text-[10px] font-bold text-slate-400 block font-mono">
            Booking ID: #{booking._id?.slice(-6)}
          </span>
          <h3 className="text-base font-bold text-slate-800 mt-0.5">{booking.subject}</h3>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={booking.status} />
          <PriceText amount={price} size="lg" className="text-emerald-700" />
        </div>
      </div>

      {/* Participants */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
          <Avatar src={booking.student?.picture} size="sm" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 block">Student</span>
            <h5 className="text-xs font-bold text-slate-800 truncate">{booking.student?.fullName}</h5>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
          <Avatar src={booking.teacher?.picture} size="sm" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 block">Teacher</span>
            <h5 className="text-xs font-bold text-slate-800 truncate">{booking.teacher?.fullName}</h5>
          </div>
        </div>
      </div>

      {/* Payment Proof / Transaction ID if available */}
      {booking.transactionId && (
        <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-amber-900">Manual Payment Reference:</span>
            <span className="font-mono font-bold text-slate-800">{booking.transactionId}</span>
          </div>
          {booking.paymentProof && (
            <a
              href={booking.paymentProof}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 font-semibold inline-flex items-center gap-1 hover:underline text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Payment Receipt
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      {isWaiting && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject?.(booking._id)}
            disabled={isLoading}
          >
            <X className="w-3.5 h-3.5 mr-1 text-rose-500" /> Reject Payment
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onApprove?.(booking._id)}
            isLoading={isLoading}
          >
            <Check className="w-3.5 h-3.5 mr-1" /> Approve & Create Classes
          </Button>
        </div>
      )}
    </div>
  );
}

export default memo(AdminBookingCard);
