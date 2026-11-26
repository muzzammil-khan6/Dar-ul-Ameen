// Job: Teacher Days Section organism displaying weekly working days configuration and trigger for editing days
import React from "react";
import Button from "../atoms/Button";
import { Calendar, Edit } from "lucide-react";

export default function TeacherDaysSection({
  daysPerWeek = 3,
  selectedDays = [],
  onEditDays,
  className = "",
}) {
  return (
    <div
      className={`p-6 bg-white border border-border rounded-2xl shadow-xs space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sage text-primary flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-charcoal">Teaching Days</h3>
            <p className="text-xs text-muted">
              Active schedule: <strong className="text-primary font-bold">{daysPerWeek} days per week</strong>
            </p>
          </div>
        </div>

        <Button size="sm" variant="outline" onClick={onEditDays}>
          <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Days
        </Button>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold text-muted block">
          Configured Working Days ({selectedDays.length}):
        </span>
        <div className="flex flex-wrap gap-2">
          {selectedDays.map((day) => (
            <span
              key={day}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sage text-primary border border-border"
            >
              {day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
