// Job: 1v1 Individual scheduled class card organism with live countdown, meet join link, and completion action
import React, { memo } from "react";
import StatusBadge from "../atoms/StatusBadge";
import DateText from "../atoms/DateText";
import TimeText from "../atoms/TimeText";
import CountdownDisplay from "../molecules/CountdownDisplay";
import MeetLinkButton from "../molecules/MeetLinkButton";
import Button from "../atoms/Button";
import { CheckCircle2 } from "lucide-react";

function ClassCard({
  classItem,
  index = 0,
  onMarkComplete,
  isTeacher = false,
  className = "",
}) {
  if (!classItem) return null;
  const isCompleted = classItem.status === "completed";

  return (
    <div
      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isCompleted
          ? "bg-slate-50 border-slate-200 opacity-80"
          : "bg-white border-slate-200 shadow-2xs"
      } ${className}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-800">Class #{index + 1}</span>
          <StatusBadge status={classItem.status || "scheduled"} />
          {!isCompleted && classItem.date && classItem.startTime && (
            <CountdownDisplay date={classItem.date} startTime={classItem.startTime} />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <DateText date={classItem.date} />
          <TimeText startTime={classItem.startTime} endTime={classItem.endTime} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isCompleted && (
          <MeetLinkButton
            meetLink={classItem.meetLink}
            date={classItem.date}
            startTime={classItem.startTime}
            endTime={classItem.endTime}
          />
        )}
        {isTeacher && !isCompleted && onMarkComplete && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMarkComplete(classItem._id)}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Complete
          </Button>
        )}
      </div>
    </div>
  );
}

export default memo(ClassCard);
