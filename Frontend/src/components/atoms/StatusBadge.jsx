// Job: Semantic status badge for Bookings, Trials, Payments, and Classes
import React from "react";
import Badge from "./Badge";

export default function StatusBadge({ status, className = "" }) {
  const norm = (status || "").toLowerCase().trim();

  const config = {
    pending: { label: "Pending", variant: "amber" },
    pending_teacher: { label: "Pending Teacher", variant: "amber" },
    accepted: { label: "Accepted", variant: "sky" },
    "accepted - pay now": { label: "Accepted - Pay Now", variant: "sky" },
    waiting_admin: { label: "Waiting for Admin", variant: "amber" },
    active: { label: "Active", variant: "emerald" },
    completed: { label: "Completed", variant: "emerald" },
    live: { label: "Live Now", variant: "emerald" },
    rejected: { label: "Rejected", variant: "rose" },
    payment_rejected: { label: "Payment Rejected", variant: "rose" },
    cancelled: { label: "Cancelled", variant: "rose" },
    expired: { label: "Expired", variant: "slate" },
    paid: { label: "Paid", variant: "emerald" },
    approved: { label: "Approved", variant: "emerald" },
  };

  const item = config[norm] || { label: status || "Unknown", variant: "slate" };

  return (
    <Badge variant={item.variant} className={className}>
      {item.label}
    </Badge>
  );
}
