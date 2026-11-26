// Job: Teacher Slots Section organism displaying available slots with per-slot delete, add slot button, and booked slots with day & subject
import React from "react";
import Button from "../atoms/Button";
import TimeText from "../atoms/TimeText";
import EmptyState from "../atoms/EmptyState";
import { Clock, Plus, Trash2, CalendarCheck, BookOpen, User } from "lucide-react";

export default function TeacherSlotsSection({
  timeSlots = [],
  bookedSlots = [],
  onAddSlot,
  onDeleteSlot,
  className = "",
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Available Slots Header & List */}
      <div className="p-6 bg-white border border-border rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sage text-primary flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-charcoal">Teaching Time Slots</h3>
              <p className="text-xs text-muted">Available session windows for booking</p>
            </div>
          </div>

          <Button size="sm" variant="primary" onClick={onAddSlot}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Time Slot
          </Button>
        </div>

        {timeSlots.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No Time Slots Added"
            description="Add teaching time slots so students can book sessions with you."
            className="py-8"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {timeSlots.map((slot) => (
              <div
                key={slot._id || `${slot.startTime}-${slot.endTime}`}
                className="p-3.5 bg-ivory border border-border rounded-xl flex items-center justify-between gap-2 hover:border-primary/40 transition-colors"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted block">
                    Slot Window
                  </span>
                  <TimeText
                    startTime={slot.startTime}
                    endTime={slot.endTime}
                    className="font-bold text-charcoal"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteSlot?.(slot._id || `${slot.startTime}-${slot.endTime}`)}
                  className="p-2 text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Time Slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booked Slots Section: Displayed with Day & Subject */}
      <div className="p-6 bg-white border border-border rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-amber/15 text-charcoal flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5 text-amber" />
          </div>
          <div>
            <h3 className="text-base font-bold text-charcoal">Booked Sessions</h3>
            <p className="text-xs text-muted">
              Scheduled classes displayed with day and subject
            </p>
          </div>
        </div>

        {bookedSlots.length === 0 ? (
          <p className="text-xs text-muted py-8 text-center italic">
            No booked slots yet. When students book regular or trial classes, they will appear here with their day and subject.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bookedSlots.map((b, idx) => (
              <div
                key={b._id || idx}
                className="p-4 bg-sage/40 border border-border rounded-xl space-y-2.5 hover:border-primary/40 transition-all"
              >
                {/* Day Header & Booked Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-primary uppercase tracking-wide">
                    {b.day}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber/20 text-charcoal border border-amber/30">
                    Booked
                  </span>
                </div>

                {/* Subject Title */}
                <div className="flex items-center gap-2 text-xs text-charcoal">
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                  <strong className="text-sm font-bold text-charcoal truncate">
                    {b.subject || "Tutoring Session"}
                  </strong>
                </div>

                {/* Slot Window */}
                <div className="text-xs text-muted font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span>
                    {b.startTime} - {b.endTime}
                  </span>
                </div>

                {/* Student Info */}
                {b.studentName && (
                  <div className="flex items-center gap-1.5 text-xs text-muted pt-2 border-t border-border">
                    <User className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span className="truncate">Student: <strong className="text-charcoal">{b.studentName}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
