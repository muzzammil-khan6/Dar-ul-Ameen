import React from "react";
import { AlertCircle } from "lucide-react";
import Button from "./Button";
import { useTranslation } from "react-i18next";

export default function ErrorState({
  title,
  message,
  onRetry,
  className = "",
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`p-6 rounded-xl border border-red-200 bg-red-50/50 flex flex-col items-center text-center my-4 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-slate-900 mb-1">
        {title || t("common.error")}
      </h4>
      <p className="text-xs text-red-700 max-w-md mb-3">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
