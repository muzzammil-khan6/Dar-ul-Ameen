import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ArrowDownToLine, Check, X } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import {
  fetchAdminWithdraws,
  approveWithdraw,
  rejectWithdraw,
} from "../../store/slices/adminSlice";

export default function AdminWithdraws() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { withdraws, isLoading, isError, message } = useSelector(
    (state) => state.admin,
  );

  useEffect(() => {
    dispatch(fetchAdminWithdraws());
  }, [dispatch]);

  const handleApprove = async (id) => {
    if (window.confirm("Approve and confirm bank payout for this withdrawal?")) {
      await dispatch(
        approveWithdraw({ id, adminNote: "Approved and transferred" }),
      );
      dispatch(fetchAdminWithdraws());
    }
  };

  const handleReject = async (id) => {
    const note = prompt("Enter rejection reason for this withdrawal request:");
    if (note !== null) {
      await dispatch(
        rejectWithdraw({
          id,
          adminNote: note || "Invalid account details provided",
        }),
      );
      dispatch(fetchAdminWithdraws());
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
              <div>
                <h1 className="block text-base font-bold text-charcoal leading-tight">
                  {t("admin.withdrawsManagement")}
                </h1>
                <p className="text-[11px] text-muted block">
                  {"Review and process tutor bank transfer and wallet cashout requests"}
                </p>
              </div> 
        {isLoading && withdraws.length === 0 ? (
          <LoadingState message="Loading withdrawal requests..." />
        ) : isError ? (
          <ErrorState
            message={message}
            onRetry={() => dispatch(fetchAdminWithdraws())}
          />
        ) : withdraws.length === 0 ? (
          <EmptyState
            title="No Withdrawal Requests"
            description="When teachers request wallet payouts, requests will appear here for admin review."
          />
        ) : (
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Teacher</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Payment / Bank Details</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Admin Note</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdraws.map((w) => {
                    const isPending = w.status === "pending";
                    return (
                      <tr key={w._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(w.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">
                            {w.teacher?.fullName || "Teacher"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {w.teacher?.email}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-extrabold text-slate-900">
                          {w.amount} PKR
                        </td>

                        <td className="py-3 px-3 text-slate-700 max-w-sm whitespace-pre-line">
                          {w.accountDetails}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              w.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : w.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-500 italic">
                          {w.adminNote || "—"}
                        </td>

                        <td className="py-3 px-3 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApprove(w._id)}
                                className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg cursor-pointer"
                                title="Approve Withdrawal"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(w._id)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="Reject Withdrawal"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
