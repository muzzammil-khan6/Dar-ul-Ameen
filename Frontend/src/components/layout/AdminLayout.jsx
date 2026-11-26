// Job: Admin portal dashboard layout wrapper delegating to atomic DashboardLayout
import React from "react";
import DashboardLayout from "../templates/DashboardLayout";

export default function AdminLayout({ children, title, subtitle }) {
  return (
    <DashboardLayout role="admin" title={title} subtitle={subtitle}>
      {children}
    </DashboardLayout>
  );
}
