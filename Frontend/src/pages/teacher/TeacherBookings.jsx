// Job: Teacher Bookings page composing BookingListLayout with TrialCard and BookingCard, real-time updates, and direct reject
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { BookOpen, Sparkles, AlertTriangle } from "lucide-react";
import TeacherLayout from "../../components/layout/TeacherLayout";
import BookingListLayout from "../../components/templates/BookingListLayout";
import BookingCard from "../../components/organisms/BookingCard";
import TrialCard from "../../components/organisms/TrialCard";
import EmptyState from "../../components/atoms/EmptyState";
import Loader from "../../components/atoms/Loader";
import {
  fetchTeacherBookings,
  acceptTeacherBooking,
  rejectTeacherBooking,
  completeClassSession,
  fetchTeacherTrials,
  acceptTeacherTrial,
  rejectTeacherTrial,
  completeTeacherTrial,
} from "../../store/slices/teacherSlice";
import { getSocket } from "../../services/socket.service";

const BOOKING_FILTERS = [
  "All",
  "Waiting for Payment",
  "Waiting for Admin",
  "Active",
  "Pending",
  "Completed",
];

const TRIAL_FILTERS = ["All", "Pending", "Accepted", "Completed", "Rejected"];

export default function TeacherBookings() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [mainTab, setMainTab] = useState("trials"); // "trials" | "bookings"
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeTrialFilter, setActiveTrialFilter] = useState("All");

  const {
    bookings,
    trials,
    isPendingApproval,
    pendingApprovalMessage,
    isLoading,
  } = useSelector((state) => state.teacher);

  useEffect(() => {
    if (mainTab === "trials") {
      dispatch(fetchTeacherTrials(activeTrialFilter));
    } else {
      dispatch(fetchTeacherBookings(activeFilter));
    }
  }, [dispatch, mainTab, activeFilter, activeTrialFilter]);

  // Real-time socket listener for teacher bookings/trials/classes
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleUpdate = () => {
      if (mainTab === "trials") {
        dispatch(fetchTeacherTrials(activeTrialFilter));
      } else {
        dispatch(fetchTeacherBookings(activeFilter));
      }
    };
    socket.on("bookingUpdated", handleUpdate);
    socket.on("trialUpdated", handleUpdate);
    socket.on("classUpdated", handleUpdate);
    return () => {
      socket.off("bookingUpdated", handleUpdate);
      socket.off("trialUpdated", handleUpdate);
      socket.off("classUpdated", handleUpdate);
    };
  }, [dispatch, mainTab, activeFilter, activeTrialFilter]);

  const getTimestamp = (item) =>
    new Date(item.updatedAt || item.createdAt || 0).getTime();

  // Deduplicate bookings by time slot, keeping only the latest update
  const latestBookingsBySlot = useMemo(() => {
    const sorted = [...(bookings || [])].sort(
      (a, b) => getTimestamp(b) - getTimestamp(a)
    );
    const seen = new Set();
    const result = [];
    for (const b of sorted) {
      const studentId = (b.student?._id || b.student)?.toString();
      const startTime = b.timeSlot?.startTime || "";
      const endTime = b.timeSlot?.endTime || "";
      const slotKey = `${studentId}_${startTime}_${endTime}`;
      if (!seen.has(slotKey)) {
        seen.add(slotKey);
        result.push(b);
      }
    }
    return result;
  }, [bookings]);

  // Exclude cancelled bookings for Teacher Portal
  const displayedBookings = useMemo(() => {
    return latestBookingsBySlot.filter((b) => {
      if (b.status === "cancelled" || b.status === "canceled" || b.status === "payment_rejected") {
        return false;
      }
      if (activeFilter === "All") return true;
      if (activeFilter === "Waiting for Payment") {
        return b.status === "accepted_by_teacher" || b.status === "confirmed";
      }
      if (activeFilter === "Waiting for Admin") {
        return b.status === "payment_done, waiting_for_admin" || b.status === "waiting_admin";
      }
      if (activeFilter === "Active") return b.status === "active";
      if (activeFilter === "Pending") return b.status === "pending";
      if (activeFilter === "Completed") return b.status === "completed";
      return true;
    });
  }, [latestBookingsBySlot, activeFilter]);

  // Deduplicate trials by time slot, keeping only the latest update
  const latestTrialsBySlot = useMemo(() => {
    const sorted = [...(trials || [])].sort(
      (a, b) => getTimestamp(b) - getTimestamp(a)
    );
    const seen = new Set();
    const result = [];
    for (const tr of sorted) {
      const studentId = (tr.student?._id || tr.student)?.toString();
      const day = (tr.day || "").toLowerCase();
      const slotKey = `${studentId}_${day}_${tr.startTime}_${tr.endTime}`;
      if (!seen.has(slotKey)) {
        seen.add(slotKey);
        result.push(tr);
      }
    }
    return result;
  }, [trials]);

  const displayedTrials = useMemo(() => {
    return latestTrialsBySlot.filter((tItem) => {
      if (activeTrialFilter === "All") {
        return tItem.status !== "cancelled" && tItem.status !== "rejected";
      }
      return tItem.status?.toLowerCase() === activeTrialFilter.toLowerCase();
    });
  }, [latestTrialsBySlot, activeTrialFilter]);

  const headerBookingsCount = useMemo(() => {
    return latestBookingsBySlot.filter(
      (b) => b.status !== "cancelled" && b.status !== "canceled" && b.status !== "payment_rejected"
    ).length;
  }, [latestBookingsBySlot]);

  const headerTrialsCount = useMemo(() => {
    return latestTrialsBySlot.filter((t) => t.status !== "cancelled" && t.status !== "rejected").length;
  }, [latestTrialsBySlot]);

  // Actions
  const handleAcceptBooking = async (bookingId) => {
    await dispatch(acceptTeacherBooking(bookingId));
    dispatch(fetchTeacherBookings(activeFilter));
  };

  const handleRejectBooking = async (bookingId) => {
    // Directly reject without popup
    await dispatch(
      rejectTeacherBooking({
        bookingId,
        reason: "Rejected directly by teacher",
      })
    );
    dispatch(fetchTeacherBookings(activeFilter));
  };

  const handleMarkClassComplete = async (bookingId, classIndex) => {
    await dispatch(completeClassSession({ bookingId, classIndex }));
    dispatch(fetchTeacherBookings(activeFilter));
  };

  const handleAcceptTrial = async (trialId) => {
    await dispatch(acceptTeacherTrial(trialId));
    dispatch(fetchTeacherTrials(activeTrialFilter));
  };

  const handleRejectTrial = async (trialId) => {
    await dispatch(rejectTeacherTrial({ trialId, reason: "Rejected directly by teacher" }));
    dispatch(fetchTeacherTrials(activeTrialFilter));
  };

  return (
    <TeacherLayout>
      {isPendingApproval && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs font-semibold">
            {pendingApprovalMessage || "Your teacher profile is under admin review. You can manage existing requests."}
          </p>
        </div>
      )}

      <BookingListLayout
        title={t("teacher.bookingsTitle") || "Student Bookings & Trials"}
        subtitle="Manage upcoming 1v1 sessions, accept student requests, and conduct classes"
        tabs={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMainTab("trials")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                mainTab === "trials"
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Trials
              {headerTrialsCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800">
                  {headerTrialsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMainTab("bookings")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                mainTab === "bookings"
                  ? "border-blue-600 text-blue-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              Bookings (Monthly Packages)
              {headerBookingsCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                  {headerBookingsCount}
                </span>
              )}
            </button>
          </div>
        }
        filters={
          (mainTab === "trials" ? TRIAL_FILTERS : BOOKING_FILTERS).map((st) => {
            const isSelected = mainTab === "trials" ? activeTrialFilter === st : activeFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => (mainTab === "trials" ? setActiveTrialFilter(st) : setActiveFilter(st))}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {st}
              </button>
            );
          })
        }
      >
        {isLoading && (!bookings || bookings.length === 0) && (!trials || trials.length === 0) ? (
          <Loader text="Loading requests..." className="py-16" />
        ) : mainTab === "trials" ? (
          displayedTrials.length === 0 ? (
            <EmptyState
              title="No Trial Requests"
              description="No free trial requests matching this filter."
            />
          ) : (
            displayedTrials.map((tr) => (
              <TrialCard
                key={tr._id}
                trial={tr}
                isTeacher={true}
                onAccept={handleAcceptTrial}
                onReject={handleRejectTrial}
              />
            ))
          )
        ) : (
          displayedBookings.length === 0 ? (
            <EmptyState
              title="No Bookings Found"
              description="No student bookings matching this filter."
            />
          ) : (
            displayedBookings.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                isTeacher={true}
                onAccept={handleAcceptBooking}
                onReject={handleRejectBooking}
                onMarkClassComplete={(idx) => handleMarkClassComplete(b._id, idx)}
              />
            ))
          )
        )}
      </BookingListLayout>
    </TeacherLayout>
  );
}
