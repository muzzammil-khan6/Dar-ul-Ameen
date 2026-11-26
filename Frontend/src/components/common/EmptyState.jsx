import React from "react";
import { FolderOpen } from "lucide-react";
import Button from "./Button";

export default function EmptyState({
  title = "No data found",
  description,
  icon: Icon = FolderOpen,
  actionText,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 my-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-slate-900 mb-1">{title}</h4>
      {description && (
        <p className="text-sm text-slate-500 max-w-md mb-4">{description}</p>
      )}
      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
