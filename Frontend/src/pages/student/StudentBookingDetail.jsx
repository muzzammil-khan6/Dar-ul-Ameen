import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  CreditCard,
  Send,
  Star,
  CheckCircle,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  Video,
} from "lucide-react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import LoadingState from "../../components/common/LoadingState";
import ErrorState from "../../components/common/ErrorState";
import { getSocket } from "../../services/socket.service";
import {
  fetchStudentBookingDetail,
  payForBooking,
  cancelStudentBooking,
  cancelStudentTrial,
  sendChatMessage,
  submitReview,
} from "../../store/slices/studentSlice";

export default function StudentBookingDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { currentBooking, isLoading, isError, message } = useSelector(
    (state) => state.student,
  );
  const { user } = useSelector((state) => state.auth);

  const [chatInput, setChatInput] = useState("");
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Live minute ticker for countdowns and join meet appearance
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (id) {
      dispatch(fetchStudentBookingDetail(id));
    }
  }, [id, dispatch]);

  // Real-time socket updates for booking and classes
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !id) return;
    const handleUpdate = () => {
      dispatch(fetchStudentBookingDetail(id));
    };
    socket.on("bookingUpdated", handleUpdate);
    socket.on("classUpdated", handleUpdate);
    return () => {
      socket.off("bookingUpdated", handleUpdate);
      socket.off("classUpdated", handleUpdate);
    };
  }, [dispatch, id]);

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const trimmed = timeStr.trim();
    const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const mins = parseInt(ampmMatch[2], 10);
      const meridiem = ampmMatch[3].toUpperCase();
      if (meridiem === "PM" && hours < 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;
      return hours * 60 + mins;
    }
    const parts = trimmed.split(":");
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  };

  const getSlotDateTime = (dateVal, timeStr) => {
    const d = new Date(dateVal);
    const totalMins = timeToMinutes(timeStr);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    d.setHours(hours, mins, 0, 0);
    return d;
  };

  const getCountdown = (startDateTime, nowDate) => {
    const diffMs = startDateTime.getTime() - nowDate.getTime();
    if (diffMs <= 0) return "Class starting now";
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const mins = totalMinutes % 60;
    if (days > 0) return `Class in ${days}d, ${hours}h, ${mins}m`;
    if (hours > 0) return `Class in ${hours}h, ${mins}m`;
    return `Class in ${mins}m`;
  };

  const getClassTiming = (cls) => {
    if (cls.status === "completed") {
      return { isLive: false, isEnded: true, countdown: "Completed" };
    }
    const start = getSlotDateTime(cls.date, cls.startTime);
    let end = getSlotDateTime(cls.date, cls.endTime);
    if (end <= start) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }
    if (now < start) {
      return {
        isLive: false,
        isEnded: false,
        countdown: getCountdown(start, now),
      };
    }
    if (now >= start && now <= end) {
      return {
        isLive: true,
        isEnded: false,
        countdown: "Live Now",
      };
    }
    return {
      isLive: false,
      isEnded: true,
      countdown: "Class Ended",
    };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    await dispatch(sendChatMessage({ bookingId: id, message: msg }));
  };

  const handlePay = async () => {
    setIsPaying(true);
    await dispatch(
      payForBooking({
        bookingId: id,
        paymentMethod: "Wallet / Mock Payment",
      }),
    );
    setIsPaying(false);
    setPayModalOpen(false);
    dispatch(fetchStudentBookingDetail(id));
  };

  const handleCancelBooking = async () => {
    if (window.confirm("Are you sure you want to cancel?")) {
      if (currentBooking?.isTrial || currentBooking?.type === "trial") {
        await dispatch(
          cancelStudentTrial({
            trialId: id,
            reason: "Cancelled by student",
          }),
        );
      } else {
        await dispatch(
          cancelStudentBooking({
            bookingId: id,
            reason: "Cancelled by student",
          }),
        );
      }
      dispatch(fetchStudentBookingDetail(id));
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setIsSubmittingReview(true);
    const res = await dispatch(
      submitReview({
        bookingId: id,
        rating,
        comment: comment.trim(),
      }),
    );
    setIsSubmittingReview(false);
    if (res.meta.requestStatus === "fulfilled") {
      setReviewModalOpen(false);
      alert("Thank you for your review!");
    }
  };

  if (isLoading || !currentBooking) {
    return <LoadingState message="Loading booking details..." height="h-96" />;
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <ErrorState message={message} />
      </div>
    );
  }

  const isCancelledStatus = (status) =>
    status &&
    (status.toLowerCase() === "cancelled" || status.toLowerCase() === "canceled");

  const isConfirmed =
    currentBooking.status === "confirmed" ||
    currentBooking.status === "accepted_by_teacher";
  const isWaitingAdmin =
    currentBooking.status === "payment_done, waiting_for_admin";
  const isActive = currentBooking.status === "active";
  const isCompleted = currentBooking.status === "completed";
  const isCancelled = isCancelledStatus(currentBooking.status);
  const isPending = currentBooking.status === "pending";

  const chatAllowed = ["confirmed", "active", "completed"].includes(
    currentBooking.status,
  );

  return (
    <div className="bg-slate-50/40 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Back and Status Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            to="/student/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Link>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isActive
                  ? "bg-green-100 text-green-800"
                  : isConfirmed
                  ? "bg-blue-100 text-blue-800"
                  : isCompleted
                  ? "bg-purple-100 text-purple-800"
                  : isCancelled
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              Status: {currentBooking.status}
            </span>

            {/* Action Buttons based on status */}
            {isConfirmed && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPayModalOpen(true)}
              >
                <CreditCard className="w-4 h-4 mr-1.5" />
                {t("student.payNow")} ({currentBooking.totalPrice} PKR)
              </Button>
            )}

            {/* If Trial is completed, show button: [Book Paid Package] */}
            {(currentBooking.isTrial || currentBooking.type === "trial") &&
              isCompleted && (
                <Link
                  to={`/teachers/${currentBooking.teacher?._id || currentBooking.teacher}?subject=${encodeURIComponent(currentBooking.subject || "")}&grade=${encodeURIComponent(currentBooking.grade || "")}`}
                >
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Book Paid Package
                  </Button>
                </Link>
              )}

            {isCompleted && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setReviewModalOpen(true)}
              >
                <Star className="w-4 h-4 mr-1.5" />
                {t("student.writeReview")}
              </Button>
            )}

            {isCancelled && (
              <Link
                to={`/teachers/${currentBooking.teacher?._id || currentBooking.teacher}?subject=${encodeURIComponent(currentBooking.subject || "")}&grade=${encodeURIComponent(currentBooking.grade || "")}`}
              >
                <Button variant="primary" size="sm">
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  {t("student.rebookTeacher") || "Rebook Tutor"}
                </Button>
              </Link>
            )}

            {(isPending || isConfirmed || isActive) && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelBooking}
              >
                Cancel Booking
              </Button>
            )}
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Package & Classes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Summary Card */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase">
                    Monthly Tutoring Package
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    {currentBooking.subject} ({currentBooking.grade})
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Tutor:{" "}
                    <span className="font-semibold text-slate-800">
                      {currentBooking.teacher?.fullName}
                    </span>{" "}
                    ({currentBooking.teacher?.city},{" "}
                    {currentBooking.teacher?.country})
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-2xl font-extrabold text-blue-600 block">
                    {currentBooking.totalPrice} PKR
                  </span>
                  <span className="text-[11px] text-slate-400">Total Price</span>
                </div>
              </div>

              {/* Package Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase">Start Date</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(currentBooking.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase">Frequency</span>
                  <span className="font-semibold text-slate-800">
                    {currentBooking.daysPerWeek} Days / Week ({(currentBooking.daysPerWeek || 3) * 4} classes/mo)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase">Duration</span>
                  <span className="font-semibold text-slate-800">
                    {currentBooking.duration} Mins / Class
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase">Payment</span>
                  <span
                    className={`font-semibold ${
                      currentBooking.isPaid
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    {currentBooking.isPaid ? "Paid" : "Pending Payment"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Classes List */}
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                {t("student.classesList")} ({currentBooking.classes?.length || 0})
              </h3>

              <div className="space-y-3">
                {currentBooking.classes?.map((cls, idx) => {
                  const dateStr = new Date(cls.date).toLocaleDateString(
                    undefined,
                    {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    },
                  );
                  const timing = getClassTiming(cls);
                  return (
                    <div
                      key={cls._id}
                      className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {cls.day} - {dateStr}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {cls.startTime} - {cls.endTime}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {cls.status === "completed" ? (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-800">
                            Completed
                          </span>
                        ) : timing.isLive ? (
                          <div className="flex items-center gap-1.5">
                            {cls.meetLink ? (
                              <a
                                href={cls.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold animate-pulse text-[11px] py-1 px-3"
                                >
                                  <Video className="w-3.5 h-3.5 mr-1" />
                                  Join Meet
                                </Button>
                              </a>
                            ) : (
                              <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 animate-pulse">
                                Live Now
                              </span>
                            )}
                          </div>
                        ) : timing.isEnded ? (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Class Ended
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timing.countdown}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Column (1 Col): Live Chat */}
          <div className="lg:col-span-1">
            <Card className="p-4 flex flex-col h-[520px]">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase">
                    {t("student.chatWithTeacher")}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    With {currentBooking.teacher?.fullName}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                {!chatAllowed ? (
                  <div className="h-full flex items-center justify-center text-center p-4 text-xs text-slate-400">
                    Chat is available once teacher confirms the booking.
                  </div>
                ) : currentBooking.chat?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-4 text-xs text-slate-400">
                    No messages yet. Say hello to your teacher!
                  </div>
                ) : (
                  currentBooking.chat?.map((msg) => {
                    const isMe = msg.sender?._id === user?.id || msg.sender === user?.id;
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                          {isMe ? "You" : msg.senderName}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                            isMe
                              ? "bg-blue-600 text-white rounded-br-none"
                              : "bg-slate-100 text-slate-800 rounded-bl-none"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              {chatAllowed && (
                <form
                  onSubmit={handleSendMessage}
                  className="pt-2 border-t border-slate-100 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Button type="submit" variant="primary" size="sm">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Confirm Payment for Tutor Package"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Subject & Grade:</span>
              <span className="font-semibold text-slate-800">
                {currentBooking.subject} ({currentBooking.grade})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Class Duration:</span>
              <span className="font-semibold text-slate-800">
                {currentBooking.duration} mins / session
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sessions Included:</span>
              <span className="font-semibold text-slate-800">
                {(currentBooking.daysPerWeek || 3) * 4} classes (1 Month)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-semibold text-slate-800">
                Wallet / Mock Payment
              </span>
            </div>
            <div className="pt-2 border-t border-blue-200 flex justify-between text-base font-bold text-slate-900">
              <span>Total Price:</span>
              <span className="text-blue-700">{currentBooking.totalPrice} PKR</span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Payment for MVP is simulated via Wallet / Mock Payment. Your classes will activate immediately upon confirmation.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPayModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isPaying}
              onClick={handlePay}
            >
              Confirm & Pay {currentBooking.totalPrice} PKR
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={t("student.writeReview")}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t("student.ratingScore")}
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? "text-amber-500 fill-amber-500"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm font-bold text-slate-700 ml-2">
                {rating} / 5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Your Feedback
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("student.reviewComment")}
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmittingReview}
            >
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
