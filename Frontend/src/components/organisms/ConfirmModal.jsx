// Job: Confirmation dialog organism with Confirm and Cancel action buttons
import React from "react";
import Modal from "./Modal";
import Button from "../atoms/Button";
import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  isOpen = false,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // danger | primary
  isLoading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            variant === "danger" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed mt-1">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
