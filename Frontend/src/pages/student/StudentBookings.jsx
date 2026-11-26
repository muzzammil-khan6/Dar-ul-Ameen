// Job: Student Bookings page composing BookingListLayout with TrialCard and BookingCard, real-time updates, and PaymentModal
import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { BookOpen, Sparkles, Wallet, Plus } from "lucide-react";
import StudentLayout from "../../components/layout/StudentLayout";
import BookingListLayout from "../../components/templates/BookingListLayout";
import BookingCard from "../../components/organisms/BookingCard";
import TrialCard from "../../components/organisms/TrialCard";
import PaymentModal from "../../components/organisms/PaymentModal";
import Button from "../../components/atoms/Button";
import EmptyState from "../../components/atoms/EmptyState";
import Loader from "../../components/atoms/Loader";
import {
  fetchStudentBookings,
  fetchStudentTrials,
  cancelStudentTrial,
  cancelStudentBooking,
  payForBooking,
  fetchStudentWallet,
  fetchPaymentSettings,
} from "../../store/slices/studentSlice";
import { getSocket } from "../../services/socket.service";

const BOOKING_STATUSES = [
  "All",
  "Accepted",
  "Waiting for Admin",
  "Active",
  "Pending",
  "Completed",
  "Cancelled",
];

const TRIAL_STATUSES = [
  "All",
  "Pending",
  "Accepted",
  "Completed",
  "Cancelled",
  "Rejected",
];

export default function StudentBookings() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const [mainTab, setMainTab] = useState(
    location.state?.activeTab === "trials" ? "trials" : "bookings"
  );
  const [activeBookingFilter, setActiveBookingFilter] = useState("All");
  const [activeTrialFilter, setActiveTrialFilter] = useState("All");

  const { bookings, trials, wallet, paymentSettings, isLoading, isError, message } =
    useSelector((state) => state.student);

  // Payment Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    if (location.state?.activeTab) {
      setMainTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);

  useEffect(() => {
    if (mainTab === "trials") {
      dispatch(fetchStudentTrials(activeTrialFilter));
    } else {
      dispatch(fetchStudentBookings(activeBookingFilter));
    }
    dispatch(fetchStudentWallet());
    dispatch(fetchPaymentSettings());
  }, [dispatch, mainTab, activeTrialFilter, activeBookingFilter]);

  // Real-time socket listener for instant booking/trial/class updates without manual refresh
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleUpdate = () => {
      if (mainTab === "trials") {
        dispatch(fetchStudentTrials(activeTrialFilter));
      } else {
        dispatch(fetchStudentBookings(activeBookingFilter));
      }
      dispatch(fetchStudentWallet());
    };
    socket.on("bookingUpdated", handleUpdate);
    socket.on("trialUpdated", handleUpdate);
    socket.on("classUpdated", handleUpdate);
    return () => {
      socket.off("bookingUpdated", handleUpdate);
      socket.off("trialUpdated", handleUpdate);
      socket.off("classUpdated", handleUpdate);
    };
  }, [dispatch, mainTab, activeTrialFilter, activeBookingFilter]);

  const isCancelledStatus = (status) =>
    status &&
    (status.toLowerCase() === "cancelled" ||
      status.toLowerCase() === "canceled" ||
      status.toLowerCase() === "payment_rejected");

  const getTimestamp = (item) =>
    new Date(item.updatedAt || item.createdAt || 0).getTime();

  // Deduplicate bookings by slot
  const latestBookingsBySlot = useMemo(() => {
    const sorted = [...(bookings || [])].sort(
      (a, b) => getTimestamp(b) - getTimestamp(a)
    );
    const seen = new Set();
    const result = [];
    for (const b of sorted) {
      const tId = (b.teacher?._id || b.teacher)?.toString();
      const startTime = b.timeSlot?.startTime || "";
      const endTime = b.timeSlot?.endTime || "";
      const slotKey = `${tId}_${startTime}_${endTime}`;
      if (!seen.has(slotKey)) {
        seen.add(slotKey);
        result.push(b);
      }
    }
    return result;
  }, [bookings]);

  // Deduplicate trials by slot
  const latestTrialsBySlot = useMemo(() => {
    const sorted = [...(trials || [])].sort(
      (a, b) => getTimestamp(b) - getTimestamp(a)
    );
    const seen = new Set();
    const result = [];
    for (const tr of sorted) {
      const tId = (tr.teacher?._id || tr.teacher)?.toString();
      const day = (tr.day || "").toLowerCase();
      const slotKey = `${tId}_${day}_${tr.startTime}_${tr.endTime}`;
      if (!seen.has(slotKey)) {
        seen.add(slotKey);
        result.push(tr);
      }
    }
    return result;
  }, [trials]);

  // Filtered lists
  const displayedTrials = useMemo(() => {
    return latestTrialsBySlot.filter((tItem) => {
      if (activeTrialFilter === "All") {
        return tItem.status !== "cancelled" && tItem.status !== "rejected";
      }
      return tItem.status?.toLowerCase() === activeTrialFilter.toLowerCase();
    });
  }, [latestTrialsBySlot, activeTrialFilter]);

  const displayedBookings = useMemo(() => {
    return latestBookingsBySlot.filter((b) => {
      const isCancelled = isCancelledStatus(b.status);
      if (activeBookingFilter === "All") return !isCancelled;
      if (activeBookingFilter === "Accepted") {
        return b.status === "accepted_by_teacher" || b.status === "confirmed" || b.status === "accepted";
      }
      if (activeBookingFilter === "Waiting for Admin") {
        return b.status === "payment_done, waiting_for_admin" || b.status === "waiting_admin";
      }
      if (activeBookingFilter === "Active") return b.status === "active";
      if (activeBookingFilter === "Completed") return b.status === "completed";
      if (activeBookingFilter === "Pending") return b.status === "pending";
      if (activeBookingFilter === "Cancelled") return isCancelled;
      return true;
    });
  }, [latestBookingsBySlot, activeBookingFilter]);

  const headerBookingsCount = useMemo(() => {
    return latestBookingsBySlot.filter((b) => !isCancelledStatus(b.status)).length;
  }, [latestBookingsBySlot]);

  const headerTrialsCount = useMemo(() => {
    return latestTrialsBySlot.filter((t) => t.status !== "cancelled" && t.status !== "rejected").length;
  }, [latestTrialsBySlot]);

  // Actions
  const handleCancelTrial = async (trialId) => {
    if (window.confirm("Are you sure you want to cancel this free trial?")) {
      await dispatch(
        cancelStudentTrial({
          trialId,
          reason: "Cancelled by student before start time",
        })
      );
      dispatch(fetchStudentTrials(activeTrialFilter));
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      await dispatch(
        cancelStudentBooking({
          bookingId,
          reason: "Cancelled by student",
        })
      );
      dispatch(fetchStudentBookings(activeBookingFilter));
    }
  };

  const openPayModal = (booking) => {
    setSelectedBooking(booking);
    setPayError("");
    setPayModalOpen(true);
  };

  const handlePayViaWallet = async (bookingId) => {
    setIsPaying(true);
    setPayError("");
    const res = await dispatch(
      payForBooking({
        bookingId,
        paymentMethod: "wallet",
      })
    );
    setIsPaying(false);
    if (res.meta.requestStatus === "fulfilled") {
      setPayModalOpen(false);
      setSelectedBooking(null);
      dispatch(fetchStudentBookings(activeBookingFilter));
      dispatch(fetchStudentWallet());
    } else {
      setPayError(res.payload || "Payment failed");
    }
  };

  const handlePayViaManual = async (bookingId, txId, proof) => {
    if (!txId.trim()) {
      setPayError("Transaction ID is required");
      return;
    }
    if (!proof) {
      setPayError("Payment screenshot proof is required");
      return;
    }
    setIsPaying(true);
    setPayError("");
    const res = await dispatch(
      payForBooking({
        bookingId,
        paymentMethod: "manual",
        transactionId: txId.trim(),
        paymentProof: proof,
      })
    );
    setIsPaying(false);
    if (res.meta.requestStatus === "fulfilled") {
      setPayModalOpen(false);
      setSelectedBooking(null);
      dispatch(fetchStudentBookings(activeBookingFilter));
      dispatch(fetchStudentWallet());
    } else {
      setPayError(res.payload || "Payment failed");
    }
  };

  const walletBalance = wallet?.balance ?? 0;

  return (
      <StudentLayout
        title={t("student.bookingsTitle") || "My 1v1 Classes"}
        subtitle={t("View your trial classes, monthly packages, live countdowns, and join sessions")}
      >
      <BookingListLayout
        title={t("student.bookingsTitle") || "My 1v1 Classes"}
        subtitle="View your trial classes, monthly packages, live countdowns, and join sessions"
        headerAction={
          <div className="flex items-center gap-3">
            <Link to="/student/wallet">
              <Button
                variant="outline"
                size="sm"
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-bold"
              >
                <Wallet className="w-4 h-4 mr-1.5" />
                Wallet: Rs. {walletBalance.toLocaleString()}
              </Button>
            </Link>
            <Link to="/teachers">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Book New Tutor
              </Button>
            </Link>
          </div>
        }
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
          (mainTab === "trials" ? TRIAL_STATUSES : BOOKING_STATUSES).map((st) => {
            const isSelected = mainTab === "trials" ? activeTrialFilter === st : activeBookingFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => (mainTab === "trials" ? setActiveTrialFilter(st) : setActiveBookingFilter(st))}
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
          <Loader text="Loading classes..." className="py-16" />
        ) : mainTab === "trials" ? (
          displayedTrials.length === 0 ? (
            <EmptyState
              title="No Trials Found"
              description="You don't have any trial classes matching this filter."
              actionLabel="Find a Tutor for Free Trial"
              onAction={() => navigate("/teachers")}
            />
          ) : (
            displayedTrials.map((tr) => (
              <TrialCard
                key={tr._id}
                trial={tr}
                isTeacher={false}
                onCancel={handleCancelTrial}
                onBookPaid={(tItem) =>
                  navigate(
                    `/teachers/${tItem.teacher?._id || tItem.teacher}?subject=${encodeURIComponent(
                      tItem.subject || ""
                    )}&grade=${encodeURIComponent(tItem.grade || "")}`
                  )
                }
              />
            ))
          )
        ) : (
          displayedBookings.length === 0 ? (
            <EmptyState
              title={t("student.noBookings") || "No Bookings Found"}
              description="You don't have any bookings matching this status filter."
              actionLabel="Find a Teacher"
              onAction={() => navigate("/teachers")}
            />
          ) : (
            displayedBookings.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                isTeacher={false}
                onPay={openPayModal}
                onCancel={handleCancelBooking}
              />
            ))
          )
        )}
      </BookingListLayout>

      <PaymentModal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        booking={selectedBooking}
        walletBalance={walletBalance}
        paymentSettings={paymentSettings}
        onPayViaWallet={handlePayViaWallet}
        onPayViaManual={handlePayViaManual}
        isLoading={isPaying}
        error={payError}
      />
    </StudentLayout>
  );
}
