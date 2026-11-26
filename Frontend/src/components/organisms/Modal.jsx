// Job: Accessible generic modal popup dialog wrapper organism
import React, { useEffect } from "react";
import { X } from "lucide-react";
import IconButton from "../atoms/IconButton";

export default function Modal({
  isOpen = false,
  onClose,
  title = "",
  children,
  maxWidth = "max-w-lg", // max-w-sm | max-w-md | max-w-lg | max-w-xl | max-w-2xl
  className = "",
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidth} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || onClose) && (
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">{title}</h3>
              {onClose && (
                <IconButton onClick={onClose} title="Close" size="sm">
                  <X className="w-4 h-4" />
                </IconButton>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
