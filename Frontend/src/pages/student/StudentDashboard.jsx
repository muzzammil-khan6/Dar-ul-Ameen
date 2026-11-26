// Job: Student Dashboard page displaying stats, invite reward card, upcoming classes, recent bookings, and suggestions
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  BookOpen,
  CreditCard,
  Search,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import StudentLayout from "../../components/layout/StudentLayout";
import TwoColumnLayout from "../../components/templates/TwoColumnLayout";
import InviteCard from "../../components/organisms/InviteCard";
import InviteModal from "../../components/organisms/InviteModal";
import FriendSuggestionCard from "../../components/organisms/FriendSuggestionCard";
import ClassCard from "../../components/organisms/ClassCard";
import Button from "../../components/atoms/Button";
import PriceText from "../../components/atoms/PriceText";
import EmptyState from "../../components/atoms/EmptyState";
import Loader from "../../components/atoms/Loader";
import StatusBadge from "../../components/atoms/StatusBadge";
import { fetchStudentDashboard } from "../../store/slices/studentSlice";
import { fetchSuggestions, sendFriendRequest, acceptFriendRequest } from "../../store/slices/friendSlice";
import { getSocket } from "../../services/socket.service";

export default function StudentDashboard() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { dashboard, isLoading, isError, message } = useSelector(
    (state) => state.student
  );
  const { suggestions = [], loadingSuggestions = false } = useSelector(
    (state) => state.friend || {}
  );
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    dispatch(fetchStudentDashboard());
    dispatch(fetchSuggestions());
  }, [dispatch]);

  // Real-time socket listener for student dashboard
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleUpdate = () => {
      dispatch(fetchStudentDashboard());
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

  if (isLoading && !dashboard) {
    return (
      <StudentLayout>
        <Loader text="Loading your dashboard..." className="py-24" />
      </StudentLayout>
    );
  }

  const stats = dashboard?.stats || {
    totalBookings: 0,
    totalSpent: 0,
    upcomingClassesCount: 0,
  };
  const upcomingClasses = dashboard?.upcomingClasses || [];
  const recentBookings = dashboard?.recentBookings || [];

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              {t("student.dashboardTitle") || "Student Dashboard"}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Track your upcoming lessons, weekly bookings, and tutor sessions.
            </p>
          </div>

          <Link to="/teachers">
            <Button variant="primary" size="md">
              <Search className="w-4 h-4 mr-2" />
              {t("student.findTutor") || "Find a Tutor"}
            </Button>
          </Link>
        </div>

        {/* Invite & Earn Banner Card */}
        <InviteCard onOpenInvite={() => setShowInviteModal(true)} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">
                {t("student.upcomingClasses") || "Upcoming Classes"}
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.upcomingClassesCount}
              </p>
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">
                {t("student.totalBookings") || "Total Bookings"}
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.totalBookings}
              </p>
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">
                {t("student.totalSpent") || "Total Spent"}
              </p>
              <PriceText amount={stats.totalSpent} size="xl" className="text-slate-900 font-bold" />
            </div>
          </div>
        </div>

        {/* 2-Column: Upcoming Classes & Recent Bookings */}
        <TwoColumnLayout
          left={
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  {t("student.upcomingClasses") || "Upcoming Classes"}
                </h3>
                <Link to="/student/bookings" className="text-xs font-semibold text-blue-600 hover:underline">
                  View all
                </Link>
              </div>

              {upcomingClasses.length === 0 ? (
                <EmptyState
                  title={t("student.noUpcoming") || "No upcoming classes"}
                  description="Book a tutor or trial session to get started!"
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {upcomingClasses.map((cls, idx) => (
                    <ClassCard
                      key={cls._id || idx}
                      classItem={cls}
                      index={idx}
                      isTeacher={false}
                    />
                  ))}
                </div>
              )}
            </div>
          }
          right={
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Recent Bookings
                </h3>
                <Link to="/student/bookings" className="text-xs font-semibold text-blue-600 hover:underline">
                  View all
                </Link>
              </div>

              {recentBookings.length === 0 ? (
                <EmptyState
                  title="No recent bookings"
                  description="Your recent bookings and classes will appear here."
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {recentBookings.slice(0, 4).map((b) => (
                    <div
                      key={b._id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">{b.subject}</h4>
                        <p className="text-[11px] text-slate-500">
                          {b.teacher?.fullName} • {b.duration || 60} mins
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

        {/* Bottom: People You May Know Suggestions */}
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
    </StudentLayout>
  );
}
