// Job: Flexible two-column layout template for dashboards and complex profile views
import React from "react";

export default function TwoColumnLayout({
  left,
  right,
  leftRatio = "2fr", // default left is wider
  className = "",
}) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      <div className={leftRatio === "2fr" ? "lg:col-span-2 space-y-6" : "space-y-6"}>
        {left}
      </div>
      <div className={leftRatio === "2fr" ? "space-y-6" : "lg:col-span-2 space-y-6"}>
        {right}
      </div>
    </div>
  );
}
