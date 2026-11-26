import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertTriangle, Info, XCircle, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bg = "bg-white border-slate-200 text-slate-800";
          let icon = <Info className="w-4 h-4 text-blue-500 shrink-0" />;

          if (toast.type === "success") {
            bg = "bg-emerald-50 border-emerald-200 text-emerald-900";
            icon = <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
          } else if (toast.type === "warning") {
            bg = "bg-amber-50 border-amber-200 text-amber-900";
            icon = <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
          } else if (toast.type === "error") {
            bg = "bg-red-50 border-red-200 text-red-900";
            icon = <XCircle className="w-4 h-4 text-red-600 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${bg}`}
            >
              <div className="mt-0.5">{icon}</div>
              <p className="text-xs font-medium leading-relaxed flex-1">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (msg) => console.log("[Toast]", msg),
    };
  }
  return context;
}
