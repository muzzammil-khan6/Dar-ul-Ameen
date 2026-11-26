import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { DollarSign, CreditCard } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import Card from "../../components/common/Card";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import { fetchAdminPayments } from "../../store/slices/adminSlice";

export default function AdminPayments() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { payments, isLoading, isError, message } = useSelector(
    (state) => state.admin,
  );

  useEffect(() => {
    dispatch(fetchAdminPayments());
  }, [dispatch]);

  const totalRevenue = payments.reduce((acc, p) => acc + (p.totalPrice || 0), 0);
  const totalCommission = payments.reduce((acc, p) => acc + (p.commission || 0), 0);
  const totalTeacherShare = payments.reduce((acc, p) => acc + (p.teacherShare || 0), 0);

  return (
    <AdminLayout
      title={t("admin.paymentsManagement")}
      subtitle="Detailed ledger of platform transactions with commission breakdowns and teacher payouts"
    >
      <div className="space-y-6">
        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Revenue Paid
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {totalRevenue} PKR
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Gross processed volume
            </span>
          </Card>

          <Card className="p-5 bg-green-50/40 border-green-200">
            <span className="text-xs font-semibold text-green-800 uppercase tracking-wider block">
              Platform Commission (20%)
            </span>
            <span className="text-2xl font-extrabold text-green-700 mt-1 block">
              {totalCommission} PKR
            </span>
            <span className="text-[11px] text-green-600 block mt-0.5">
              Retained platform earnings
            </span>
          </Card>

          <Card className="p-5 bg-blue-50/40 border-blue-200">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">
              Total Teacher Share (80%)
            </span>
            <span className="text-2xl font-extrabold text-blue-700 mt-1 block">
              {totalTeacherShare} PKR
            </span>
            <span className="text-[11px] text-blue-600 block mt-0.5">
              Credited to tutor wallets
            </span>
          </Card>
        </div>

        {/* Payments Table */}
        {isLoading && payments.length === 0 ? (
          <LoadingState message="Loading payment transactions..." />
        ) : isError ? (
          <ErrorState
            message={message}
            onRetry={() => dispatch(fetchAdminPayments())}
          />
        ) : payments.length === 0 ? (
          <EmptyState
            title="No Payments Recorded"
            description="When students pay for confirmed monthly packages, transaction records will appear here."
          />
        ) : (
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">{t("admin.studentCol")}</th>
                    <th className="py-3 px-3">{t("admin.teacherCol")}</th>
                    <th className="py-3 px-3">Subject</th>
                    <th className="py-3 px-3">{t("admin.totalCol")}</th>
                    <th className="py-3 px-3 text-green-700 font-bold">
                      {t("admin.commissionCol")}
                    </th>
                    <th className="py-3 px-3 text-blue-700 font-bold">
                      {t("admin.teacherShareCol")}
                    </th>
                    <th className="py-3 px-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {p.student?.fullName || "Student"}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {p.teacher?.fullName || "Teacher"}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {p.booking?.subject || "Tutoring Package"}
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-900">
                        {p.totalPrice} PKR
                      </td>

                      <td className="py-3 px-3 font-bold text-green-700 bg-green-50/40">
                        {p.commission} PKR
                      </td>

                      <td className="py-3 px-3 font-bold text-blue-700 bg-blue-50/40">
                        {p.teacherShare} PKR
                      </td>

                      <td className="py-3 px-3 text-slate-500">
                        {p.paymentMethod}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
