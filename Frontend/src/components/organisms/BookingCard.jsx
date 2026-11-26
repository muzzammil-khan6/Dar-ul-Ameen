// Job: 1v1 Paid Booking card organism with teacher/student info, classes list, price, countdown, and lifecycle actions
import React, { memo } from "react";
import StatusBadge from "../atoms/StatusBadge";
import PriceText from "../atoms/PriceText";
import TimeText from "../atoms/TimeText";
import DateText from "../atoms/DateText";
import Avatar from "../atoms/Avatar";
import Button from "../atoms/Button";
import ClassCard from "./ClassCard";
import { BookOpen, Check, X, CreditCard, ChevronDown, ChevronUp } from "lucide-react";

function BookingCard({
  booking,
  isTeacher = false,
  onPay,
  onAccept,
  onReject,
  onCancel,
  onMarkClassComplete,
  className = "",
}) {
  const [showClasses, setShowClasses] = React.useState(true);

  if (!booking) return null;
  const partner = isTeacher ? booking.student : booking.teacher;
  const price = booking.totalPrice || booking.rate || 0;
  const isAccepted =
    booking.status === "accepted" ||
    booking.status === "accepted_by_teacher" ||
    booking.status === "confirmed";
  const isPending = booking.status === "pending";
  const isActive = booking.status === "active";
  const classes = booking.classes || [];

  return (
    <div className={`p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            1v1 Regular Booking
          </span>
          <h3 className="text-base font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            {booking.subject}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={booking.status} />
          <PriceText amount={price} size="lg" className="text-emerald-700 ml-1" />
        </div>
      </div>

      {/* Partner & Slot Info */}
      <div className="flex items-center gap-3 p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
        <Avatar src={partner?.picture} size="md" />
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-slate-400 block font-medium">
            {isTeacher ? "Student" : "Teacher"}
          </span>
          <h4 className="text-xs font-bold text-slate-800 truncate">{partner?.fullName}</h4>
        </div>
        <div className="text-right text-xs text-slate-500">
          {booking.startDate && <DateText date={booking.startDate} />}
          {booking.timeSlot && (
            <div className="mt-0.5">
              <TimeText startTime={booking.timeSlot.startTime} endTime={booking.timeSlot.endTime} />
            </div>
          )}
        </div>
      </div>

      {/* Scheduled Classes List */}
      {isActive && classes.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowClasses(!showClasses)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-700 py-1 hover:text-emerald-600 cursor-pointer"
          >
            <span>Scheduled 1v1 Classes ({classes.length})</span>
            {showClasses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showClasses && (
            <div className="space-y-2">
              {classes.map((cls, idx) => (
                <ClassCard
                  key={cls._id || idx}
                  classItem={cls}
                  index={idx}
                  isTeacher={isTeacher}
                  onMarkComplete={onMarkClassComplete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
        <div>
          {isPending && !isTeacher && (
            <span className="text-xs text-amber-600 font-medium">Waiting for teacher acceptance...</span>
          )}
          {(booking.status === "waiting_admin" || booking.status === "payment_done, waiting_for_admin") && (
            <span className="text-xs text-amber-600 font-medium">Payment submitted. Waiting for admin approval.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Student: Cancel Button */}
          {!isTeacher && (isPending || isAccepted) && onCancel && (
            <Button size="sm" variant="outline" onClick={() => onCancel(booking._id)}>
              Cancel
            </Button>
          )}

          {/* Student: Pay Now button when accepted */}
          {!isTeacher && isAccepted && onPay && (
            <Button size="sm" variant="primary" onClick={() => onPay(booking)}>
              <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay Now & Unlock Classes
            </Button>
          )}

          {/* Teacher: Accept & Direct Reject (no popup per rule) */}
          {isTeacher && isPending && (
            <>
              <Button size="sm" variant="primary" onClick={() => onAccept?.(booking._id)}>
                <Check className="w-3.5 h-3.5 mr-1" /> Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReject?.(booking._id)}>
                <X className="w-3.5 h-3.5 mr-1 text-rose-500" /> Reject Directly
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(BookingCard);
