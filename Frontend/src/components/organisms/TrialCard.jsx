// Job: 1v1 Free Trial class card organism with teacher/student info, live countdown, meet join, and action buttons
import React, { memo } from "react";
import StatusBadge from "../atoms/StatusBadge";
import DateText from "../atoms/DateText";
import TimeText from "../atoms/TimeText";
import CountdownDisplay from "../molecules/CountdownDisplay";
import MeetLinkButton from "../molecules/MeetLinkButton";
import Avatar from "../atoms/Avatar";
import Button from "../atoms/Button";
import { BookOpen, Check, X, ArrowRight } from "lucide-react";

function TrialCard({
  trial,
  isTeacher = false,
  onAccept,
  onReject,
  onCancel,
  onBookPaid,
  className = "",
}) {
  if (!trial) return null;
  const partner = isTeacher ? trial.student : trial.teacher;
  const isAccepted = trial.status === "accepted";
  const isPending = trial.status === "pending";

  return (
    <div className={`p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 ${className}`}>
      {/* Top row: Subject, Status, Countdown */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
            1v1 Free Trial
          </span>
          <h3 className="text-base font-bold text-slate-800 mt-1 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            {trial.subject}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={trial.status} />
          {isAccepted && trial.date && trial.startTime && (
            <CountdownDisplay date={trial.date} startTime={trial.startTime} />
          )}
        </div>
      </div>

      {/* Partner info */}
      <div className="flex items-center gap-3 p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
        <Avatar src={partner?.picture} size="md" />
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-slate-400 block font-medium">
            {isTeacher ? "Student" : "Teacher"}
          </span>
          <h4 className="text-xs font-bold text-slate-800 truncate">{partner?.fullName}</h4>
        </div>
        <div className="text-right text-xs text-slate-500">
          <DateText date={trial.date} />
          <div className="mt-0.5">
            <TimeText startTime={trial.startTime} endTime={trial.endTime} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
        <div className="flex items-center gap-2">
          {isAccepted && (
            <MeetLinkButton
              meetLink={trial.meetLink}
              date={trial.date}
              startTime={trial.startTime}
              endTime={trial.endTime}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Student: Cancel Button */}
          {!isTeacher && (isPending || isAccepted) && onCancel && (
            <Button size="sm" variant="outline" onClick={() => onCancel(trial._id)}>
              Cancel Trial
            </Button>
          )}

          {isTeacher && isPending && (
            <>
              <Button size="sm" variant="primary" onClick={() => onAccept?.(trial._id)}>
                <Check className="w-3.5 h-3.5 mr-1" /> Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => onReject?.(trial._id)}>
                <X className="w-3.5 h-3.5 mr-1 text-rose-500" /> Reject Directly
              </Button>
            </>
          )}

          {!isTeacher && isAccepted && onBookPaid && (
            <Button size="sm" variant="secondary" onClick={() => onBookPaid(trial)}>
              Book Regular Class <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(TrialCard);
