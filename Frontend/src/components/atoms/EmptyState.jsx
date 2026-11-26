// Job: Generic empty state placeholder atom
import React from "react";
import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No data found",
  description = "",
  action,
  className = "",
}) {
  return (
    <div className={`h-full py-12 px-4 text-center border border-dashed border-slate-200 rounded-2xl bg-white ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
