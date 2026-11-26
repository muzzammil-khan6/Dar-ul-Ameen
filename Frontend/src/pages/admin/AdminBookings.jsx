// Job: Admin Bookings page managing paid booking approval/rejection and real-time socket updates
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import AdminLayout from "../../components/layout/AdminLayout";
import AdminBookingCard from "../../components/organisms/AdminBookingCard";
import Modal from "../../components/organisms/Modal";
import FormField from "../../components/molecules/FormField";
import Button from "../../components/atoms/Button";
import EmptyState from "../../components/atoms/EmptyState";
import Loader from "../../components/atoms/Loader";
import {
  fetchAdminBookings,
  approveBookingPayment,
  rejectBookingPayment,
} from "../../store/slices/adminSlice";
import { getSocket } from "../../services/socket.service";
import { useToast } from "../../context/ToastContext";

const FILTER_STATUSES = [
  "All",
  "payment_done, waiting_for_admin",
  "accepted_by_teacher",
  "pending",
  "active",
  "completed",
];

export default function AdminBookings() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const [activeFilter, setActiveFilter] = useState("All");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetBookingId, setTargetBookingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const { bookings, isLoading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminBookings(activeFilter));
  }, [dispatch, activeFilter]);

  // Real-time socket listener for admin bookings
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleBookingUpdate = (data) => {
      dispatch(fetchAdminBookings(activeFilter));
      if (
        data?.booking?.status === "payment_done, waiting_for_admin" ||
        data?.status === "payment_done, waiting_for_admin"
      ) {
        showToast("New Payment Received for verification!", "info");
      }
    };
    socket.on("bookingUpdated", handleBookingUpdate);
    return () => {
      socket.off("bookingUpdated", handleBookingUpdate);
    };
  }, [dispatch, activeFilter, showToast]);

  const handleApprove = async (id) => {
    if (
      !window.confirm(
        "Approve this payment? This will confirm the booking, create classes, and notify student & teacher."
      )
    )
      return;
    setProcessingId(id);
    await dispatch(approveBookingPayment(id));
    setProcessingId(null);
    dispatch(fetchAdminBookings(activeFilter));
  };

  const handleOpenReject = (id) => {
    setTargetBookingId(id);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!targetBookingId) return;
    setProcessingId(targetBookingId);
    await dispatch(
      rejectBookingPayment({
        bookingId: targetBookingId,
        reason: rejectReason || "Payment rejected by admin",
      })
    );
    setProcessingId(null);
    setRejectModalOpen(false);
    setTargetBookingId(null);
    setRejectReason("");
    dispatch(fetchAdminBookings(activeFilter));
  };

  // Exclude cancelled bookings from Admin Portal
  const displayBookings = (bookings || []).filter(
    (b) =>
      b.status !== "cancelled" &&
      b.status !== "canceled" &&
      b.status !== "payment_rejected"
  );

  return (
    <AdminLayout
      title="Booking & Payment Approvals"
      subtitle="Review student payments, verify bank screenshots, and activate monthly tuition schedules"
    >
      <div className="space-y-6">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FILTER_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setActiveFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeFilter === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {st === "payment_done, waiting_for_admin" ? "Waiting for Admin Approval" : st}
            </button>
          ))}
        </div>

        {/* Content list */}
        {isLoading && (!bookings || bookings.length === 0) ? (
          <Loader text="Loading bookings..." className="py-20" />
        ) : displayBookings.length === 0 ? (
          <EmptyState
            title="No Bookings Found"
            description="No bookings match the selected status filter."
            className="py-16"
          />
        ) : (
          <div className="space-y-4">
            {displayBookings.map((b) => (
              <AdminBookingCard
                key={b._id}
                booking={b}
                onApprove={() => handleApprove(b._id)}
                onReject={() => handleOpenReject(b._id)}
                isLoading={processingId === b._id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reject Payment Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Booking Payment"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <FormField
            label="Reason for Rejection"
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Invalid transaction ID or payment not received"
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              size="md"
              variant="outline"
              type="button"
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="md"
              variant="danger"
              type="submit"
              isLoading={Boolean(processingId)}
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
