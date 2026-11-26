// Job: Teacher Subject Card organism displaying subject title, grades, hourly/monthly rates, duration, and edit/delete actions
import React from "react";
import Button from "../atoms/Button";
import PriceText from "../atoms/PriceText";
import Badge from "../atoms/Badge";
import { BookOpen, Clock, Edit, Trash2 } from "lucide-react";

export default function TeacherSubjectCard({
  subject,
  duration = 30,
  onEdit,
  onDelete,
  className = "",
}) {
  if (!subject) return null;
  const grades = subject.grades || [];

  return (
    <div
      className={`p-5 bg-white border border-border rounded-2xl shadow-xs space-y-4 hover:border-primary/40 transition-all ${className}`}
    >
      {/* Subject Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sage text-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-charcoal">{subject.name}</h3>
            <span className="text-xs text-muted flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-muted" />
              Standard Duration: <strong className="text-charcoal">{duration} mins</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(subject)}
              className="p-1.5 text-muted hover:text-primary hover:bg-sage/50 rounded-lg transition-colors cursor-pointer"
              title="Edit Subject"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(subject.name)}
              className="p-1.5 text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Subject"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grades and Details */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
          Offered Grades ({grades.length})
        </span>
        <div className="flex flex-wrap gap-1.5">
          {grades.map((g) => (
            <Badge key={g} variant="neutral" size="sm">
              {g}
            </Badge>
          ))}
        </div>
      </div>

      {/* Rate Display */}
      <div className="p-3 bg-sage/40 border border-border rounded-xl flex items-center justify-between text-xs">
        <span className="text-muted font-medium">Hourly Rate:</span>
        <div className="flex items-center gap-1 font-bold text-primary text-sm">
          <span>Rs. {Number(subject.rate || 0).toLocaleString()}</span>
          <span className="text-[10px] text-muted font-normal">/ hr</span>
        </div>
      </div>
    </div>
  );
}
