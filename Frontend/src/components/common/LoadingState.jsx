import React from "react";
import { useTranslation } from "react-i18next";

export default function LoadingState({ message, height = "h-64" }) {
  const { t } = useTranslation();
  return (
    <div
      className={`w-full ${height} flex flex-col items-center justify-center gap-3 text-slate-500`}
    >
      <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium">{message || t("common.loading")}</p>
    </div>
  );
}
