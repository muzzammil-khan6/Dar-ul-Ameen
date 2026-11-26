// Job: Admin Wallet Requests page managing student wallet top-up approvals/rejections with real-time socket updates
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import AdminLayout from "../../components/layout/AdminLayout";
import TopUpRequestCard from "../../components/organisms/TopUpRequestCard";
import Modal from "../../components/organisms/Modal";
import FormField from "../../components/molecules/FormField";
import Button from "../../components/atoms/Button";
import EmptyState from "../../components/atoms/EmptyState";
import Loader from "../../components/atoms/Loader";
import {
  fetchWalletRequests,
  approveWalletRequest,
  rejectWalletRequest,
} from "../../store/slices/adminSlice";
import { getSocket } from "../../services/socket.service";
import { useToast } from "../../context/ToastContext";

const STATUSES = ["All", "pending_admin", "approved", "rejected"];

export default function AdminWalletRequests() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [activeFilter, setActiveFilter] = useState("All");
  const [processingId, setProcessingId] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetTopupId, setTargetTopupId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const { showToast } = useToast();
  const { walletRequests, isLoading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchWalletRequests(activeFilter));
  }, [dispatch, activeFilter]);

  // Real-time socket listener for admin wallet requests
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleWalletUpdate = (data) => {
      dispatch(fetchWalletRequests(activeFilter));
      if (data?.action === "topup_requested") {
        showToast("New Wallet Top-up request submitted!", "info");
      }
    };
    socket.on("walletUpdated", handleWalletUpdate);
    return () => {
      socket.off("walletUpdated", handleWalletUpdate);
    };
  }, [dispatch, activeFilter, showToast]);

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this wallet top-up and credit funds to the student?")) return;
    setProcessingId(id);
    await dispatch(approveWalletRequest({ id, adminNote: "Approved by admin" }));
    setProcessingId(null);
    dispatch(fetchWalletRequests(activeFilter));
  };

  const handleOpenReject = (id) => {
    setTargetTopupId(id);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!targetTopupId) return;
    setProcessingId(targetTopupId);
    await dispatch(
      rejectWalletRequest({
        id: targetTopupId,
        adminNote: rejectReason || "Rejected by admin",
      })
    );
    setProcessingId(null);
    setRejectModalOpen(false);
    setTargetTopupId(null);
    setRejectReason("");
    dispatch(fetchWalletRequests(activeFilter));
  };

  const displayedRequests = (walletRequests || []).filter((r) => {
    if (activeFilter === "All") return true;
    return r.status === activeFilter;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
              <div>
                <h1 className="block text-base font-bold text-charcoal leading-tight">
                  {t("Student Wallet Top-up Requests")}
                </h1>
                <p className="text-[11px] text-muted block">
                  {"Review proof screenshots, verify JazzCash / Easypaisa transaction IDs, and credit student balances"}
                </p>
        </div>
        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATUSES.map((st) => (
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
              {st === "pending_admin" ? "Pending Admin" : st}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading && (!walletRequests || walletRequests.length === 0) ? (
          <Loader text="Loading top-up requests..." className="py-20" />
        ) : displayedRequests.length === 0 ? (
          <EmptyState
            title="No Top-up Requests Found"
            description="No requests match the selected filter."
            className="py-16"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedRequests.map((req) => (
              <TopUpRequestCard
                key={req._id}
                request={req}
                onApprove={() => handleApprove(req._id)}
                onReject={() => handleOpenReject(req._id)}
                isLoading={processingId === req._id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Top-up Request"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <FormField
            label="Reason for Rejection"
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Transaction ID not found or invalid screenshot"
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
