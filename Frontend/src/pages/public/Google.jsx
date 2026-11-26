import React, { useEffect } from "react";
import LoadingState from "../../components/common/LoadingState";

export default function Google() {
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || "https://s45mkq2p-3000.inc1.devtunnels.ms/api";
    window.location.href = `${backendUrl}/auth/google`;
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <LoadingState message="Connecting to Google..." />
    </div>
  );
}
