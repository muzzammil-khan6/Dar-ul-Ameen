// Job: Teacher Dashboard page displaying earnings, referral reward card, upcoming classes, recent booking requests, and suggestions
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Wallet,
  Users,
  Calendar,
  Clock,
  ArrowRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import TeacherLayout from "../../components/layout/TeacherLayout";
import TwoColumnLayout from "../../components/templates/TwoColumnLayout";
import InviteCard from "../../components/organisms/InviteCard";
import InviteModal from "../../components/organisms/InviteModal";
import FriendSuggestionCard from "../../components/organisms/FriendSuggestionCard";
import PriceText from "../../components/atoms/PriceText";
import EmptyState from "../../components/atoms/EmptyState";
import Loader from "../../components/atoms/Loader";
import StatusBadge from "../../components/atoms/StatusBadge";
import Button from "../../components/atoms/Button";
import { fetchTeacherDashboard } from "../../store/slices/teacherSlice";
import { fetchSuggestions, sendFriendRequest, acceptFriendRequest } from "../../store/slices/friendSlice";
import { getSocket } from "../../services/socket.service";

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    dashboard,
    isPendingApproval,
    pendingApprovalMessage,
    isLoading,
    isError,
    message,
  } = useSelector((state) => state.teacher);
  const { suggestions = [], loadingSuggestions = false } = useSelector(
    (state) => state.friend || {}
  );
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    dispatch(fetchTeacherDashboard());
    dispatch(fetchSuggestions());
  }, [dispatch]);

  // Real-time socket listener for teacher dashboard
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleUpdate = () => {
      dispatch(fetchTeacherDashboard());
    };
    socket.on("dashboardUpdated", handleUpdate);
    socket.on("bookingUpdated", handleUpdate);
    socket.on("classUpdated", handleUpdate);
    socket.on("walletUpdated", handleUpdate);
    return () => {
      socket.off("dashboardUpdated", handleUpdate);
      socket.off("bookingUpdated", handleUpdate);
      socket.off("classUpdated", handleUpdate);
      socket.off("walletUpdated", handleUpdate);
    };
  }, [dispatch]);

  const handleSendFriendRequest = async (targetId) => {
    await dispatch(sendFriendRequest(targetId));
    dispatch(fetchSuggestions());
  };

  const handleAcceptRequest = async (reqId) => {
    await dispatch(acceptFriendRequest(reqId));
    dispatch(fetchSuggestions());
  };

  if (isPendingApproval) {
    return (
      <TeacherLayout>
        <EmptyState
          icon={AlertTriangle}
          title={t("approval.pendingTitle") || "Profile Under Review"}
          description={
            pendingApprovalMessage ||
            t("approval.pendingMessage") ||
            "Your teacher profile is currently pending admin verification."
          }
          actionLabel="Check Application Status"
          onAction={() => navigate("/teacher/pending-approval")}
        />
      </TeacherLayout>
    );
  }

  if (isLoading && !dashboard) {
    return (
      <TeacherLayout>
        <Loader text="Loading teacher dashboard..." className="py-24" />
      </TeacherLayout>
    );
  }

  const upcomingClasses = dashboard?.upcomingClasses || [];
  const recentBookings = (dashboard?.recentBookings || []).filter((b) => b.status !== "cancelled");

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">
            {t("teacher.dashboardTitle") || "Teacher Dashboard"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Overview of your active bookings, earnings, and upcoming classes
          </p>
        </div>

        {/* Invite & Earn Banner Card */}
        <InviteCard onOpenInvite={() => setShowInviteModal(true)} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">
                {t("teacher.availableBalance") || "Available Balance"}
              </p>
              <PriceText amount={dashboard?.stats?.availableBalance || 0} size="xl" className="text-slate-900 font-bold" />
              <span className="text-[10px] text-amber-600 font-medium block mt-0.5">
                Pending Locked: Rs. {dashboard?.stats?.pendingBalance || 0}
              </span>
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">
                {t("teacher.totalStudents") || "Total Students"}
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {dashboard?.stats?.totalStudents || 0}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Active learners</span>
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Platform Share</p>
              <p className="text-2xl font-bold text-slate-900">
                {100 - (dashboard?.stats?.commissionPercentage || 20)}%
              </p>
              <span className="text-[10px] text-green-600 font-medium block mt-0.5">You receive 80%</span>
            </div>
          </div>
        </div>

        {/* 2-Column: Upcoming Classes & Recent Bookings */}
        <TwoColumnLayout
          left={
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  {t("teacher.upcomingClasses") || "Upcoming Classes"}
                </h3>
                <Link to="/teacher/bookings" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                  View All
                </Link>
              </div>

              {upcomingClasses.length === 0 ? (
                <EmptyState
                  title="No upcoming classes"
                  description="Classes will appear here once student bookings are active."
                  className="py-6"
                />
              ) : (
                <div className="space-y-3">
                  {upcomingClasses.map((cls) => {
                    const dateStr = new Date(cls.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                    const isTrial = cls.isTrial || cls.type === "trial";
                    return (
                      <div
                        key={cls._id}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-xs font-bold text-slate-900">
                              {cls.student?.fullName || "Student"}
                            </h4>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                isTrial
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {isTrial ? "Trial Class" : "Paid Class"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {cls.booking?.subject} ({cls.booking?.grade})
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-blue-600 font-mono block">
                            {cls.startTime} - {cls.endTime}
                          </span>
                          <span className="text-[10px] text-slate-400">{dateStr}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          }
          right={
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  {t("teacher.recentBookings") || "Recent Bookings"}
                </h3>
                <Link to="/teacher/bookings" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                  Manage
                </Link>
              </div>

              {recentBookings.length === 0 ? (
                <EmptyState
                  title="No booking requests"
                  description="Student requests will appear here."
                  className="py-6"
                />
              ) : (
                <div className="space-y-3">
                  {recentBookings.slice(0, 4).map((b) => (
                    <div
                      key={b._id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{b.student?.fullName}</h4>
                        <p className="text-[11px] text-slate-500">
                          {b.subject} • {b.duration || 60} mins
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={b.status} />
                        <PriceText amount={b.totalPrice || b.rate || 0} size="sm" className="block text-slate-600 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          }
        />

        {/* Bottom: People You May Know */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              People You May Know (1v1 Connections)
            </h3>
            <Link to="/chat" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
              Go to Chats <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingSuggestions ? (
            <Loader text="Finding suggested connections..." className="py-6" />
          ) : suggestions.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No suggestions available right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suggestions.slice(0, 3).map((item) => (
                <FriendSuggestionCard
                  key={item.user?._id}
                  item={item}
                  onAddFriend={handleSendFriendRequest}
                  onAcceptRequest={handleAcceptRequest}
                  onOpenChat={() => navigate(`/chat/${item.user?._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <InviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} />
    </TeacherLayout>
  );
}
