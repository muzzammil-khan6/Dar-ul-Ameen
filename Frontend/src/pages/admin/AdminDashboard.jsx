import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import LoadingState from "../../components/common/LoadingState";
import ErrorState from "../../components/common/ErrorState";
import { fetchAdminDashboard } from "../../store/slices/adminSlice";
import { getSocket } from "../../services/socket.service";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { dashboard, isLoading, isError, message } = useSelector(
    (state) => state.admin,
  );

  useEffect(() => {
    dispatch(fetchAdminDashboard());
  }, [dispatch]);

  // Real-time socket listener for admin dashboard metrics
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleUpdate = () => {
      dispatch(fetchAdminDashboard());
    };
    socket.on("dashboardUpdated", handleUpdate);
    socket.on("bookingUpdated", handleUpdate);
    socket.on("walletUpdated", handleUpdate);
    return () => {
      socket.off("dashboardUpdated", handleUpdate);
      socket.off("bookingUpdated", handleUpdate);
      socket.off("walletUpdated", handleUpdate);
    };
  }, [dispatch]);

  const stats = dashboard?.stats || {};
  // Cancelled bookings must never be displayed in the Admin Portal
  const recentBookings = (dashboard?.recentBookings || []).filter(
    (b) => b.status !== "cancelled" && b.status !== "canceled",
  );

  return (
    <AdminLayout
      title={t("admin.dashboardTitle")}
      subtitle="Overview of platform users, teachers, bookings, and financial performance"
    >
      {isLoading && !dashboard ? (
        <LoadingState message="Loading platform overview..." />
      ) : isError ? (
        <ErrorState
          message={message}
          onRetry={() => dispatch(fetchAdminDashboard())}
        />
      ) : (
        <div className="space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">
                  {t("admin.totalUsers")}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.totalUsers || 0}
                </p>
                <span className="text-[10px] text-slate-400">
                  {stats.totalStudents || 0} Students
                </span>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">
                  {t("admin.totalTeachers")}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.totalTeachers || 0}
                </p>
                <span className="text-[10px] text-amber-600 font-semibold">
                  {stats.pendingApprovalsCount || 0} Pending
                </span>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">
                  {t("admin.totalBookings")}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.totalBookings || 0}
                </p>
                <span className="text-[10px] text-slate-400">
                  Packages booked
                </span>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">
                  {t("admin.commissionEarned")}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.commissionEarned || 0} PKR
                </p>
                <span className="text-[10px] text-slate-400">
                  Revenue: {stats.totalRevenue || 0} PKR
                </span>
              </div>
            </Card>
          </div>

          {/* Quick Notice if pending teacher requests */}
          {stats.pendingApprovalsCount > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <p className="text-xs sm:text-sm text-amber-900">
                  You have <span className="font-bold">{stats.pendingApprovalsCount}</span> teacher request(s) waiting for approval.
                </p>
              </div>
              <Link to="/admin/teachers">
                <Button variant="primary" size="sm">
                  Review Approvals
                </Button>
              </Link>
            </div>
          )}

          {/* Recent Bookings Table */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Recent Platform Bookings
              </h3>
              <Link
                to="/admin/bookings"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No bookings recorded yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Teacher</th>
                      <th className="py-2.5 px-3">Subject & Grade</th>
                      <th className="py-2.5 px-3">Total Price</th>
                      <th className="py-2.5 px-3">Commission</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {b.student?.fullName || "Student"}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {b.teacher?.fullName || "Teacher"}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {b.subject} ({b.grade})
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {b.totalPrice} PKR
                        </td>
                        <td className="py-3 px-3 font-bold text-green-700">
                          {b.commission} PKR
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              b.status === "active"
                                ? "bg-green-100 text-green-800"
                                : b.status === "confirmed"
                                ? "bg-blue-100 text-blue-800"
                                : b.status === "completed"
                                ? "bg-purple-100 text-purple-800"
                                : b.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
