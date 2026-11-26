import React, { useEffect } from "react";
import LoadingState from "../../components/common/LoadingState";

export default function Google() {
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    window.location.href = `${backendUrl}/auth/google`;
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <LoadingState message="Connecting to Google..." />
    </div>
  );
}
