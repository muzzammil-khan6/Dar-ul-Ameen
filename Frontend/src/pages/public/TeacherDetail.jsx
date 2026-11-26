import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Star,
  MapPin,
  Clock,
  Calendar,
  BookOpen,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import LoadingState from "../../components/common/LoadingState";
import ErrorState from "../../components/common/ErrorState";
import { fetchTeacherDetail } from "../../store/slices/publicTeachersSlice";
import {
  createBooking,
  createTrial,
  fetchStudentBookings,
  fetchStudentTrials,
} from "../../store/slices/studentSlice";

export default function TeacherDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useSelector((state) => state.auth);
  const { currentTeacher, isLoading, isError, message } = useSelector(
    (state) => state.publicTeachers,
  );
  const {
    bookings: studentBookings,
    trials: studentTrials,
    isLoading: isBookingLoading,
    isError: isBookingError,
    message: bookingError,
  } = useSelector((state) => state.student);

  const formatTime12h = (time24) => {
    if (!time24) return "";
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  };

  const formatSeatTime = (startTime, endTime) => {
    return `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`;
  };

  const getTodayDateStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Modals state
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Common selection
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [startDate] = useState(getTodayDateStr());

  // Trial specific selection
  const [selectedTrialDay, setSelectedTrialDay] = useState("");
  const [selectedTrialSeatIndex, setSelectedTrialSeatIndex] = useState(0);
  const [trialError, setTrialError] = useState("");
  const [isTrialSubmitting, setIsTrialSubmitting] = useState(false);

  // Paid package specific selection
  const [selectedPaidSeatIndex, setSelectedPaidSeatIndex] = useState(0);

  const formatLastActive = (dateStr) => {
    if (!dateStr) return null;
    const now = new Date();
    const activeDate = new Date(dateStr);
    const diffMs = Math.max(0, now.getTime() - activeDate.getTime());
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) {
      return t("teachers.activeNow");
    }
    if (diffMins < 60) {
      return t("teachers.activeMinsAgo", { count: diffMins });
    }
    if (diffHours < 24) {
      return t("teachers.activeHoursAgo", { count: diffHours });
    }
    if (diffDays === 1) {
      return t("teachers.activeYesterday");
    }
    if (diffDays < 7) {
      return t("teachers.activeDaysAgo", { count: diffDays });
    }
    return t("teachers.activeOn", {
      date: activeDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    });
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchTeacherDetail(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (
      user?.role === "student" ||
      (Array.isArray(user?.role) && user?.role.includes("student"))
    ) {
      dispatch(fetchStudentBookings());
      dispatch(fetchStudentTrials());
    }
  }, [id, user, dispatch]);

  const teacher = currentTeacher?.teacher;
  const schedule = currentTeacher?.schedule;
  const reviews = currentTeacher?.reviews || [];

  const activeTeacherBookings = useMemo(() => {
    if (
      currentTeacher?.activeBookings &&
      Array.isArray(currentTeacher.activeBookings) &&
      currentTeacher.activeBookings.length > 0
    ) {
      return currentTeacher.activeBookings;
    }
    if (!studentBookings || !Array.isArray(studentBookings)) return [];
    return studentBookings.filter(
      (b) =>
        (b.teacher?._id === id || b.teacher === id) &&
        [
          "pending",
          "accepted_by_teacher",
          "payment_done, waiting_for_admin",
          "active",
          "confirmed",
        ].includes(b.status),
    );
  }, [currentTeacher, studentBookings, id]);

  const availableSeatsByDay = currentTeacher?.availableSeatsByDay || {};
  const availablePaidSeats = currentTeacher?.availablePaidSeats || [];

  // Subject-specific active trial: student can have trials for different subjects
  const currentSubjectTrial = useMemo(() => {
    if (
      currentTeacher?.studentTrials &&
      Array.isArray(currentTeacher.studentTrials)
    ) {
      const matched = currentTeacher.studentTrials.find(
        (t) => t.subject?.toLowerCase() === selectedSubject?.toLowerCase(),
      );
      if (matched) return matched;
    }
    if (studentTrials && Array.isArray(studentTrials)) {
      const matched = studentTrials.find(
        (t) =>
          (t.teacher?._id === id || t.teacher === id) &&
          t.subject?.toLowerCase() === selectedSubject?.toLowerCase() &&
          ["pending", "accepted", "completed"].includes(t.status),
      );
      if (matched) return matched;
    }
    if (
      currentTeacher?.existingTrial?.subject?.toLowerCase() ===
      selectedSubject?.toLowerCase()
    ) {
      return currentTeacher.existingTrial;
    }
    return null;
  }, [currentTeacher, studentTrials, selectedSubject, id]);

  // Initialize selectedTrialDay from schedule.selectedDays
  useEffect(() => {
    if (schedule?.selectedDays?.length > 0 && !selectedTrialDay) {
      setSelectedTrialDay(schedule.selectedDays[0]);
    }
  }, [schedule, selectedTrialDay]);

  const currentDaySeats = useMemo(() => {
    return availableSeatsByDay[selectedTrialDay] || [];
  }, [availableSeatsByDay, selectedTrialDay]);

  const chosenTrialSeat =
    currentDaySeats[selectedTrialSeatIndex] || currentDaySeats[0];
  const chosenPaidSeat =
    availablePaidSeats[selectedPaidSeatIndex] || availablePaidSeats[0];

  // When teacher loaded or query params change, initialize subject and grade without auto-opening modals
  useEffect(() => {
    if (schedule?.subjects?.length > 0) {
      const searchParams = new URLSearchParams(location.search);
      const querySubject = searchParams.get("subject");
      const queryGrade = searchParams.get("grade");

      const matchedSub = querySubject
        ? schedule.subjects.find(
            (s) => s.name?.toLowerCase() === querySubject.toLowerCase(),
          )
        : null;

      const activeSub = matchedSub || schedule.subjects[0];
      setSelectedSubject(activeSub.name);

      if (queryGrade && activeSub.grades?.includes(queryGrade)) {
        setSelectedGrade(queryGrade);
      } else if (activeSub.grades?.length > 0) {
        setSelectedGrade(activeSub.grades[0]);
      }
    }
  }, [schedule, location.search]);

  const handleSubjectChange = (e) => {
    const subName = e.target.value;
    setSelectedSubject(subName);
    const sub = schedule.subjects.find((s) => s.name === subName);
    if (sub && sub.grades?.length > 0) {
      setSelectedGrade(sub.grades[0]);
    } else {
      setSelectedGrade("");
    }
  };

  const handleOpenTrial = () => {
    if (!user) {
      navigate("/login", { state: { from: `/teachers/${id}` } });
      return;
    }
    setTrialError("");
    setTrialModalOpen(true);
  };

  const handleConfirmTrial = async (e) => {
    e.preventDefault();
    setTrialError("");
    if (
      !selectedSubject ||
      !selectedGrade ||
      !selectedTrialDay ||
      !chosenTrialSeat
    ) {
      setTrialError(
        "Please select subject, grade, day, and an available seat.",
      );
      return;
    }

    setIsTrialSubmitting(true);
    const result = await dispatch(
      createTrial({
        teacherId: id,
        subject: selectedSubject,
        grade: selectedGrade,
        day: selectedTrialDay,
        seat: {
          startTime: chosenTrialSeat.startTime,
          endTime: chosenTrialSeat.endTime,
        },
        startTime: chosenTrialSeat.startTime,
        endTime: chosenTrialSeat.endTime,
      }),
    );
    setIsTrialSubmitting(false);

    if (result.meta.requestStatus === "fulfilled") {
      dispatch(fetchTeacherDetail(id));
      dispatch(fetchStudentTrials());
      setTrialModalOpen(false);
      navigate("/student/bookings", { state: { activeTab: "trials" } });
    } else {
      const errMsg = result.payload || "Failed to book trial";
      setTrialError(errMsg);
    }
  };

  const handleOpenBooking = () => {
    if (!user) {
      navigate("/login", { state: { from: `/teachers/${id}` } });
      return;
    }
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSubject || !selectedGrade || !chosenPaidSeat) return;

    const payload = {
      teacherId: id,
      subject: selectedSubject,
      grade: selectedGrade,
      startDate: startDate || getTodayDateStr(),
      timeSlot: {
        startTime: chosenPaidSeat.startTime,
        endTime: chosenPaidSeat.endTime,
      },
    };

    const result = await dispatch(createBooking(payload));
    if (result.meta.requestStatus === "fulfilled") {
      dispatch(fetchTeacherDetail(id));
      dispatch(fetchStudentBookings());
      setBookingModalOpen(false);
      navigate("/student/bookings", { state: { activeTab: "bookings" } });
    }
  };

  const subjectRatesMap = new Map();
  schedule?.rates?.forEach((r) => {
    subjectRatesMap.set(r.subjectName, r.calculatedRate);
  });

  const currentCalculatedRate =
    subjectRatesMap.get(selectedSubject) ||
    schedule?.rates?.[0]?.calculatedRate ||
    1500;

  const getPackageDaysPreview = () => {
    if (!chosenPaidSeat || !schedule?.selectedDays?.length) return "";
    const seatStr = `${formatTime12h(chosenPaidSeat.startTime)}-${formatTime12h(chosenPaidSeat.endTime)}`;
    const daysStr = schedule.selectedDays
      .map((d) => `${d.slice(0, 3)} ${seatStr}`)
      .join(", ");
    const totalClasses = (schedule.daysPerWeek || 3) * 4;
    return `Your Monthly Package: ${daysStr} (${schedule.daysPerWeek || 3} days/wk, ${totalClasses} classes/mo) - Total ${currentCalculatedRate} PKR / month`;
  };

  if (isLoading || !teacher) {
    return <LoadingState message="Loading teacher profile..." height="h-96" />;
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <ErrorState message={message} />
      </div>
    );
  }

  return (
    <div className="bg-ivory text-charcoal min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Navigation Link */}
        <div className="mb-6">
          <Link
            to="/teachers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("teachers.backToSearch") || "Back to Find Tutors"}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Header Card */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <img
                  src={
                    teacher.picture ||
                    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                  }
                  alt={teacher.fullName}
                  className="w-24 h-24 rounded-2xl object-cover border border-slate-200"
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-slate-900">
                      {teacher.fullName}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verified Tutor
                    </span>
                    {teacher.lastActive && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        {formatLastActive(teacher.lastActive)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {teacher.city}, {teacher.country}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1 font-semibold text-slate-900">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{teacher.avgRating || 5.0}</span>
                      <span className="text-slate-400 font-normal">
                        ({teacher.totalReviews || 0} reviews)
                      </span>
                    </div>

                    <span>•</span>

                    <div>
                      <span className="font-semibold text-slate-900">
                        {teacher.totalClassesCompleted || 0}
                      </span>{" "}
                      classes completed
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  {t("teacherProfile.about")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {teacher.bio ||
                    "Experienced educator passionate about structured learning and top academic results."}
                </p>
              </div>
            </Card>

            {/* 2. Subjects & Grades */}
            <Card className="p-6 bg-white border border-border rounded-xl">
              <h3 className="text-sm font-bold text-charcoal mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                {t("teacherProfile.subjectsTaught")}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {schedule?.subjects?.map((sub, i) => {
                  const isSelected = sub.name === selectedSubject;
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedSubject(sub.name);
                        if (sub.grades?.length > 0) setSelectedGrade(sub.grades[0]);
                      }}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-sage/60 ring-1 ring-primary shadow-xs"
                          : "border-border bg-sage/20 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-charcoal">
                            {sub.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary text-white">
                              Selected
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-primary">
                          {subjectRatesMap.get(sub.name) || 1500} PKR / month
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {sub.grades?.map((g, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] bg-white border border-border text-muted"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 3. Schedule Preview */}
            <Card className="p-6 bg-white border border-border rounded-xl">
              <h3 className="text-sm font-bold text-charcoal mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {t("teacherProfile.schedulePreview")}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-sage/60 border border-border text-center">
                  <span className="text-[11px] text-muted block uppercase">
                    Days per week
                  </span>
                  <span className="text-base font-bold text-primary">
                    {schedule?.daysPerWeek || 3} Days
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-sage/60 border border-border text-center">
                  <span className="text-[11px] text-muted block uppercase">
                    Class Duration
                  </span>
                  <span className="text-base font-bold text-primary">
                    {schedule?.duration || 30} Minutes
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-sage/60 border border-border text-center">
                  <span className="text-[11px] text-muted block uppercase">
                    Package Length
                  </span>
                  <span className="text-base font-bold text-primary">
                    1 Month (4 Wks)
                  </span>
                </div>
              </div>

              {/* Teaching Days & Available Time Slots */}
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-charcoal block mb-2">
                    {t("teacherProfile.teachingDays")}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {schedule?.selectedDays?.map((day) => (
                      <span
                        key={day}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-sage text-primary border border-border"
                      >
                        {t(`common.days.${day}`, day)}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-2">
                    {t("teacherProfile.availableTimeSlots")}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availablePaidSeats.length > 0 ? (
                      availablePaidSeats.map((seat, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-50 border border-slate-200 text-slate-800 shadow-xs"
                        >
                          {formatSeatTime(seat.startTime, seat.endTime)}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        No available seats currently
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* 4. Student Reviews */}
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                {t("teacherProfile.studentReviews")} ({reviews.length})
              </h3>

              {reviews.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">
                  {t("teacherProfile.noReviews")}
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div
                      key={r._id}
                      className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/40"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              r.student?.picture ||
                              "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                            }
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs font-bold text-slate-900">
                            {r.student?.fullName || "Student"}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3 h-3 ${
                                idx < r.rating
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Book Lesson Widget */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24 space-y-5 bg-white border border-border rounded-xl">
              <div>
                <span className="text-xs text-muted block">Monthly Package Rate</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-extrabold text-primary">
                    {currentCalculatedRate} PKR
                  </span>
                  <span className="text-xs text-muted">/ month</span>
                </div>
                {selectedSubject && (
                  <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="font-medium text-muted">Course Subject:</span>
                    <span className="font-bold text-primary bg-sage px-2 py-0.5 rounded border border-border">
                      {selectedSubject} {selectedGrade ? `(${selectedGrade})` : ""}
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-muted mt-2">
                  Covers {schedule?.daysPerWeek || 3} days/wk ({(schedule?.daysPerWeek || 3) * 4} classes/mo) of {schedule?.duration || 30} mins
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-border text-xs text-muted">
                <div className="flex items-center justify-between">
                  <span>Days per week</span>
                  <span className="font-semibold text-charcoal">
                    {schedule?.daysPerWeek || 3} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Class duration</span>
                  <span className="font-semibold text-charcoal">
                    {schedule?.duration || 30} mins
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Platform guarantee</span>
                  <span className="font-semibold text-primary">100% Secure</span>
                </div>
              </div>

              {/* If student has active bookings with this teacher, show an informative banner */}
              {activeTeacherBookings && activeTeacherBookings.length > 0 && (
                <div className="pt-2 space-y-2">
                  <div className="p-3.5 rounded-xl bg-amber/15 border border-amber/30 text-charcoal space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-charcoal">
                        <Clock className="w-4 h-4 shrink-0 text-amber" />
                        <span>{t("teacherProfile.applicationAlreadySent", "Active Bookings")} ({activeTeacherBookings.length})</span>
                      </div>
                      <Link
                        to="/student/bookings"
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        {t("teacherProfile.viewExistingBooking", "View Bookings")}
                      </Link>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      You have active booking(s) with this teacher. You can also request a different subject or another available time slot below.
                    </p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {activeTeacherBookings.map((b, idx) => (
                        <div
                          key={b._id || idx}
                          className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-border"
                        >
                          <div>
                            <span className="font-semibold text-charcoal block">
                              {b.subject} {b.grade ? `(${b.grade})` : ""}
                            </span>
                            {b.timeSlot && (
                              <span className="text-[10px] text-muted font-mono">
                                {formatSeatTime(b.timeSlot.startTime, b.timeSlot.endTime)}
                              </span>
                            )}
                          </div>
                          <span className="uppercase px-1.5 py-0.5 rounded bg-sage text-primary font-bold text-[10px] border border-border">
                            {b.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* If student has trial for the selected subject with this teacher */}
              {currentSubjectTrial && currentSubjectTrial.status !== "cancelled" && (
                <div className="pt-2 space-y-2">
                  <div className="p-3.5 rounded-xl bg-sage/60 border border-border text-charcoal space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-primary">
                        <Clock className="w-4 h-4 shrink-0 text-primary" />
                        <span>
                          {currentSubjectTrial.status === "completed"
                            ? "Trial Completed"
                            : `Trial Request (${currentSubjectTrial.status})`}
                        </span>
                      </div>
                      <Link
                        to="/student/bookings"
                        state={{ activeTab: "trials" }}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        View
                      </Link>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {currentSubjectTrial.status === "completed"
                        ? `You have completed your trial for ${currentSubjectTrial.subject} (${currentSubjectTrial.grade}). You can book full packages below.`
                        : `Trial for ${currentSubjectTrial.subject} on ${currentSubjectTrial.day} (${formatSeatTime(currentSubjectTrial.startTime, currentSubjectTrial.endTime)}).`}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons: Book Paid Package and Book Free Trial */}
              <div className="pt-2 space-y-2.5">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleOpenBooking}
                  className="w-full shadow-xs"
                  disabled={availablePaidSeats.length === 0}
                >
                  Book Paid Package
                </Button>

                {(!currentSubjectTrial || currentSubjectTrial.status === "cancelled") && (
                  <Button
                    variant="cta"
                    size="lg"
                    onClick={handleOpenTrial}
                    className="w-full shadow-xs"
                  >
                    Book Free Trial
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Free Trial Modal */}
      <Modal
        isOpen={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        title="Book Free Trial Class"
        maxWidth="max-w-md"
      >
        {trialError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 space-y-2">
            <p className="font-semibold">{trialError}</p>
            {trialError.toLowerCase().includes("already took a trial") && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setTrialModalOpen(false);
                  setBookingModalOpen(true);
                }}
                className="w-full mt-2"
              >
                Book Paid Package
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleConfirmTrial} className="space-y-4">
          {/* Subject Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Subject *
            </label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {schedule?.subjects?.map((sub) => (
                <option key={sub.name} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Grade *
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {schedule?.subjects
                ?.find((s) => s.name === selectedSubject)
                ?.grades?.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
            </select>
          </div>

          {/* Day Dropdown (Only Teacher Selected Days) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Day *
            </label>
            <select
              value={selectedTrialDay}
              onChange={(e) => {
                setSelectedTrialDay(e.target.value);
                setSelectedTrialSeatIndex(0);
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {schedule?.selectedDays?.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Seat Dropdown (Only Available Seats for that Day) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Seat *
            </label>
            {currentDaySeats.length > 0 ? (
              <select
                value={selectedTrialSeatIndex}
                onChange={(e) =>
                  setSelectedTrialSeatIndex(Number(e.target.value))
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-medium text-slate-800"
              >
                {currentDaySeats.map((seat, sIdx) => (
                  <option key={sIdx} value={sIdx}>
                    {formatSeatTime(seat.startTime, seat.endTime)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                No available trial seats on {selectedTrialDay}. Please choose
                another day.
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              Trial duration is auto-calculated ({schedule?.duration || 30}{" "}
              minutes).
            </p>
          </div>

          {/* Preview Box */}
          {chosenTrialSeat && (
            <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1 text-xs">
              <span className="font-semibold text-emerald-900 block">
                Trial Preview:
              </span>
              <p className="text-emerald-800 font-medium">
                Your Trial: {selectedTrialDay},{" "}
                {formatSeatTime(
                  chosenTrialSeat.startTime,
                  chosenTrialSeat.endTime,
                )}{" "}
                ({schedule?.duration || 30} min) - Free
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setTrialModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isTrialSubmitting}
              disabled={!chosenTrialSeat || currentDaySeats.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm Free Trial
            </Button>
          </div>
        </form>
      </Modal>

      {/* Paid Booking Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title="Book Paid Package"
        maxWidth="max-w-md"
      >
        {isBookingError && (
          <ErrorState message={bookingError} className="mb-4" />
        )}

        <form onSubmit={handleConfirmBooking} className="space-y-4">
          {/* Subject Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("teacherProfile.selectSubject")} *
            </label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {schedule?.subjects?.map((sub) => (
                <option key={sub.name} value={sub.name}>
                  {sub.name} (
                  {subjectRatesMap.get(sub.name) || 1500} PKR / month)
                </option>
              ))}
            </select>
          </div>

          {/* Grade Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("teacherProfile.selectGrade")} *
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {schedule?.subjects
                ?.find((s) => s.name === selectedSubject)
                ?.grades?.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
            </select>
          </div>

          {/* Start Date: Default is today's date, not selectable by user */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("teacherProfile.startDate")}
            </label>
            <div className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-slate-800 select-none">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                {new Date().toLocaleDateString(undefined, {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {t("teacherProfile.today")}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {t("teacherProfile.startDateAutoNotice")}
            </p>
          </div>

          {/* Time Seat Selection (Dropdown of availablePaidSeats) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Time Seat *
            </label>
            {availablePaidSeats.length > 0 ? (
              <select
                value={selectedPaidSeatIndex}
                onChange={(e) =>
                  setSelectedPaidSeatIndex(Number(e.target.value))
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-medium text-slate-800"
              >
                {availablePaidSeats.map((seat, idx) => (
                  <option key={idx} value={idx}>
                    {formatSeatTime(seat.startTime, seat.endTime)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                No available time seats free across all teacher schedule days.
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              Same time seat applies automatically to all teacher days (
              {schedule?.selectedDays?.join(", ")}).
            </p>
          </div>

          {/* Package Preview Box */}
          {chosenPaidSeat && (
            <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1 text-xs">
              <span className="font-semibold text-blue-900 block">
                Package Preview:
              </span>
              <p className="text-blue-800 font-medium">
                {getPackageDaysPreview()}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setBookingModalOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isBookingLoading}
              disabled={
                !chosenPaidSeat ||
                availablePaidSeats.length === 0
              }
            >
              {t("teacherProfile.confirmBooking")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
