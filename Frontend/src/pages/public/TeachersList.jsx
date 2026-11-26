import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Star,
  MapPin,
  Clock,
  Calendar,
  Filter,
  RotateCcw,
  Search,
  BookOpen,
} from "lucide-react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import StudentLayout from "../../components/layout/StudentLayout";
import {
  fetchPublicTeachers,
  setFilter,
  resetFilters,
} from "../../store/slices/publicTeachersSlice";
import { fetchSubjects } from "../../store/slices/adminSlice";
import {
  fetchStudentBookings,
  fetchStudentTrials,
} from "../../store/slices/studentSlice";

export default function TeachersList() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { user, activeRole } = useSelector((state) => state.auth);
  const { teachers, filters, isLoading, isError, message } = useSelector(
    (state) => state.publicTeachers,
  );
  const { subjects } = useSelector((state) => state.admin);
  const { bookings: studentBookings, trials: studentTrials } = useSelector(
    (state) => state.student,
  );

  const isStudent =
    Boolean(user) &&
    (activeRole === "student" ||
      (!activeRole &&
        (user.role === "student" ||
          (Array.isArray(user.role) && user.role.includes("student")))));

  // Load subjects for dropdown and initial teachers
  useEffect(() => {
    dispatch(fetchSubjects());
  }, [dispatch]);

  // If student is logged in, fetch their bookings and trials to detect existing applications
  useEffect(() => {
    if (isStudent) {
      dispatch(fetchStudentBookings());
      dispatch(fetchStudentTrials());
    }
  }, [isStudent, dispatch]);

  // Fetch teachers whenever filters change (debounced 300ms to avoid API spam on keystrokes)
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchPublicTeachers(filters));
    }, 300);
    return () => clearTimeout(timer);
  }, [dispatch, filters]);

  const handleFilterChange = (key, value) => {
    dispatch(setFilter({ [key]: value }));
  };

  const handleClearFilters = () => {
    dispatch(resetFilters());
  };

  const gradeOptions = [
    "All",
    "Class 1-5",
    "Class 6-8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12",
    "O Level",
    "A Level",
  ];

  const dayOptions = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const cityOptions = [
    "All",
    "Karachi",
    "Lahore",
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Peshawar",
    "Multan",
    "Quetta",
  ];

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

  // Top Filter Bar used inside Student Portal (StudentLayout)
  const renderTopFilters = () => (
    <Card className="p-4 sm:p-5 mb-6 bg-white border border-border rounded-xl">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
        <div className="flex items-center gap-2 font-bold text-sm text-charcoal">
          <Filter className="w-4 h-4 text-primary" />
          <span>{t("teachers.filters")}</span>
        </div>
        <button
          type="button"
          onClick={handleClearFilters}
          className="text-xs text-primary hover:text-primaryDark flex items-center gap-1 font-medium cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t("common.clearFilters")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="sm:col-span-2 md:col-span-2 lg:col-span-2">
          <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search tutor name..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
            {t("common.subject")}
          </label>
          <select
            value={filters.subject}
            onChange={(e) => handleFilterChange("subject", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="All">{t("common.all")} Subjects</option>
            {subjects?.map((sub) => (
              <option key={sub._id} value={sub.name}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Grade */}
        <div>
          <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
            {t("common.grade")}
          </label>
          <select
            value={filters.grade}
            onChange={(e) => handleFilterChange("grade", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            {gradeOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Day */}
        <div>
          <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
            {t("teachers.dayFilter")}
          </label>
          <select
            value={filters.day || "All"}
            onChange={(e) => handleFilterChange("day", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="All">{t("teachers.allDays")}</option>
            {dayOptions.map((d) => (
              <option key={d} value={d}>
                {t(`common.days.${d}`, d)}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
            {t("common.city")}
          </label>
          <select
            value={filters.city}
            onChange={(e) => handleFilterChange("city", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Days Per Week */}
        <div>
          <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
            {t("common.daysPerWeek")}
          </label>
          <select
            value={filters.daysPerWeek}
            onChange={(e) => handleFilterChange("daysPerWeek", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="All">{t("common.all")}</option>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <option key={num} value={num}>
                {num} {t("common.daysPerWeek")}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
            {t("common.duration")}
          </label>
          <select
            value={filters.duration}
            onChange={(e) => handleFilterChange("duration", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="All">{t("common.all")}</option>
            {[20, 30, 40, 50, 60].map((dur) => (
              <option key={dur} value={dur}>
                {dur} {t("common.minutes")}
              </option>
            ))}
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
            {t("common.gender")}
          </label>
          <div className="grid grid-cols-3 gap-1">
            {["All", "Male", "Female"].map((g) => {
              const selected = filters.gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleFilterChange("gender", g)}
                  className={`py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    selected
                      ? "bg-primary text-white border-primary font-semibold"
                      : "bg-white text-charcoal border-border hover:bg-sage/40"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
            Rating
          </label>
          <select
            value={filters.rating}
            onChange={(e) => handleFilterChange("rating", e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="All">{t("common.all")}</option>
            <option value="4+">★ 4.0 & above</option>
            <option value="3+">★ 3.0 & above</option>
          </select>
        </div>
      </div>
    </Card>
  );

  // Sidebar Filter Card used in Public View
  const renderSidebarFilters = () => (
    <Card className="p-5 sticky top-24 space-y-5 bg-white border border-border rounded-xl">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2 font-bold text-sm text-charcoal">
          <Filter className="w-4 h-4 text-primary" />
          <span>{t("teachers.filters")}</span>
        </div>
        <button
          type="button"
          onClick={handleClearFilters}
          className="text-xs text-primary hover:text-primaryDark flex items-center gap-1 font-medium cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t("common.clearFilters")}</span>
        </button>
      </div>

      {/* Search by Name */}
      <div>
        <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
          Search
        </label>
        <div className="relative">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="Search tutor name..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
          <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
          {t("common.subject")}
        </label>
        <select
          value={filters.subject}
          onChange={(e) => handleFilterChange("subject", e.target.value)}
          className="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        >
          <option value="All">{t("common.all")} Subjects</option>
          {subjects?.map((sub) => (
            <option key={sub._id} value={sub.name}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grade */}
      <div>
        <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
          {t("common.grade")}
        </label>
        <select
          value={filters.grade}
          onChange={(e) => handleFilterChange("grade", e.target.value)}
          className="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        >
          {gradeOptions.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
          {t("common.city")}
        </label>
        <select
          value={filters.city}
          onChange={(e) => handleFilterChange("city", e.target.value)}
          className="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        >
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Days Per Week (1 to 7) */}
      <div>
        <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
          {t("common.daysPerWeek")}
        </label>
        <select
          value={filters.daysPerWeek}
          onChange={(e) => handleFilterChange("daysPerWeek", e.target.value)}
          className="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        >
          <option value="All">{t("common.all")}</option>
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <option key={num} value={num}>
              {num} {t("common.daysPerWeek")}
            </option>
          ))}
        </select>
      </div>

      {/* Available Teaching Day (Monday, Tuesday, etc.) */}
      <div>
        <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
          {t("teachers.dayFilter")}
        </label>
        <select
          value={filters.day || "All"}
          onChange={(e) => handleFilterChange("day", e.target.value)}
          className="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        >
          <option value="All">{t("teachers.allDays")}</option>
          {dayOptions.map((d) => (
            <option key={d} value={d}>
              {t(`common.days.${d}`, d)}
            </option>
          ))}
        </select>
      </div>

      {/* Duration (20, 30, 40, 50, 60 min) */}
      <div>
        <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
          {t("common.duration")}
        </label>
        <select
          value={filters.duration}
          onChange={(e) => handleFilterChange("duration", e.target.value)}
          className="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        >
          <option value="All">{t("common.all")}</option>
          {[20, 30, 40, 50, 60].map((dur) => (
            <option key={dur} value={dur}>
              {dur} {t("common.minutes")}
            </option>
          ))}
        </select>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
          {t("common.gender")}
        </label>
        <div className="grid grid-cols-3 gap-1">
          {["All", "Male", "Female"].map((g) => {
            const selected = filters.gender === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => handleFilterChange("gender", g)}
                className={`py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  selected
                    ? "bg-primary text-white border-primary font-semibold"
                    : "bg-white text-charcoal border-border hover:bg-sage/40"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5">
          Rating
        </label>
        <select
          value={filters.rating}
          onChange={(e) => handleFilterChange("rating", e.target.value)}
          className="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        >
          <option value="All">{t("common.all")}</option>
          <option value="4+">★ 4.0 & above</option>
          <option value="3+">★ 3.0 & above</option>
        </select>
      </div>
    </Card>
  );

  // Common Teachers List Rendering - Displays a separate card for each subject
  const renderTeachersList = () => {
    if (isLoading) {
      return <LoadingState />;
    }
    if (isError) {
      return (
        <ErrorState
          message={message}
          onRetry={() => dispatch(fetchPublicTeachers(filters))}
        />
      );
    }

    // Expand teachers into individual subject cards
    const teacherSubjectCards = [];
    if (teachers && teachers.length > 0) {
      for (const teacher of teachers) {
        const subjects = teacher.schedule?.subjects || [];
        const rates = teacher.schedule?.rates || [];

        if (subjects.length > 0) {
          for (const sub of subjects) {
            // Subject filter check
            if (
              filters.subject &&
              filters.subject !== "All" &&
              sub.name?.toLowerCase() !== filters.subject.toLowerCase()
            ) {
              continue;
            }

            // Grade filter check
            if (
              filters.grade &&
              filters.grade !== "All" &&
              !sub.grades?.some(
                (g) => g.toLowerCase() === filters.grade.toLowerCase()
              )
            ) {
              continue;
            }

            // Search filter check
            if (filters.search && filters.search.trim()) {
              const q = filters.search.trim().toLowerCase();
              const matchName = teacher.fullName?.toLowerCase().includes(q);
              const matchSub = sub.name?.toLowerCase().includes(q);
              const matchCity = teacher.city?.toLowerCase().includes(q);
              if (!matchName && !matchSub && !matchCity) {
                continue;
              }
            }

            // Find specific rate for this subject
            const rateObj = rates.find(
              (r) => r.subjectName?.toLowerCase() === sub.name?.toLowerCase()
            );
            const subjectRate =
              rateObj?.calculatedRate ||
              rates[0]?.calculatedRate ||
              1500;

            // Price filter check
            if (
              filters.minPrice &&
              filters.minPrice !== "All" &&
              subjectRate < Number(filters.minPrice)
            ) {
              continue;
            }
            if (
              filters.maxPrice &&
              filters.maxPrice !== "All" &&
              subjectRate > Number(filters.maxPrice)
            ) {
              continue;
            }

            teacherSubjectCards.push({
              teacher,
              subject: sub,
              rate: subjectRate,
              cardKey: `${teacher._id}_${sub.name}`,
            });
          }
        } else {
          // Fallback if teacher has no explicit subjects
          const fallbackRate = rates[0]?.calculatedRate || 1500;
          teacherSubjectCards.push({
            teacher,
            subject: { name: "General Tutoring", grades: [] },
            rate: fallbackRate,
            cardKey: `${teacher._id}_general`,
          });
        }
      }
    }

    if (teacherSubjectCards.length === 0) {
      return (
        <EmptyState
          title={t("teachers.noTeachersFound")}
          description="Try broadening your filters or clearing search criteria to see available teachers."
          actionText={t("common.clearFilters")}
          onAction={handleClearFilters}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-xs text-slate-500 mb-2 font-medium">
          Showing {teacherSubjectCards.length} available subject courses
        </div>

        {teacherSubjectCards.map(({ teacher, subject, rate, cardKey }) => {
          const detailUrl = `/teachers/${teacher._id}?subject=${encodeURIComponent(subject.name)}${subject.grades?.[0] ? `&grade=${encodeURIComponent(subject.grades[0])}` : ""}`;
          const bookNowUrl = detailUrl;

          // Active booking check for this teacher AND specific subject
          const activeBooking =
            studentBookings?.find(
              (b) =>
                (b.teacher?._id === teacher._id || b.teacher === teacher._id) &&
                b.subject?.toLowerCase() === subject.name?.toLowerCase() &&
                [
                  "pending",
                  "accepted_by_teacher",
                  "payment_done, waiting_for_admin",
                  "active",
                  "confirmed",
                ].includes(b.status),
            ) ||
            teacher.activeBookings?.find(
              (b) =>
                !b.isTrial &&
                b.subject?.toLowerCase() === subject.name?.toLowerCase() &&
                [
                  "pending",
                  "accepted_by_teacher",
                  "payment_done, waiting_for_admin",
                  "active",
                  "confirmed",
                ].includes(b.status),
            );

          // Active trial check for this teacher AND specific subject
          const activeTrial =
            studentTrials?.find(
              (t) =>
                (t.teacher?._id === teacher._id || t.teacher === teacher._id) &&
                t.subject?.toLowerCase() === subject.name?.toLowerCase() &&
                ["pending", "accepted"].includes(t.status),
            ) ||
            teacher.activeBookings?.find(
              (b) =>
                b.isTrial &&
                b.subject?.toLowerCase() === subject.name?.toLowerCase() &&
                ["pending", "accepted"].includes(b.status),
            );

          const isPending = activeBooking?.status === "pending";

          return (
            <Card
              key={cardKey}
              hover
              className="p-6 transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                {/* Profile Info */}
                <div className="flex items-start gap-4">
                  <Link to={detailUrl} className="shrink-0 group">
                    <img
                      src={
                        teacher.picture ||
                        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                      }
                      alt={teacher.fullName}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:opacity-90 transition-opacity"
                    />
                  </Link>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={detailUrl} className="hover:text-primary transition-colors">
                        <h3 className="text-lg font-bold text-charcoal hover:text-primary">
                          {teacher.fullName}
                        </h3>
                      </Link>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber/15 text-charcoal border border-amber/30">
                        <Star className="w-3 h-3 text-amber fill-amber" />
                        {teacher.avgRating || 5.0} ({teacher.totalReviews || 0})
                      </span>
                      {teacher.lastActive && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sage text-primary border border-border">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                          {formatLastActive(teacher.lastActive)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-muted" />
                      {teacher.city}, {teacher.country}
                    </p>

                    {/* Prominent Subject & Grades Banner */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-sage text-primary border border-border">
                        <BookOpen className="w-3.5 h-3.5 text-primary" />
                        <span>{subject.name}</span>
                      </div>
                      {subject.grades?.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs font-semibold text-muted">
                            Grades:
                          </span>
                          {subject.grades.map((g, gIdx) => (
                            <span
                              key={gIdx}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-sage/60 text-charcoal border border-border"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted mt-2 line-clamp-2 max-w-xl">
                      {teacher.bio ||
                        "Experienced educator passionate about structured learning and top academic results."}
                    </p>

                    {/* Selected Teaching Days */}
                    {teacher.schedule?.selectedDays?.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                        <span className="text-xs font-semibold text-charcoal flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          {t("teachers.teachingDays")}:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {teacher.schedule.selectedDays.map((day) => (
                            <span
                              key={day}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-sage text-primary border border-border"
                            >
                              {t(`common.days.${day}`, day)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Schedule Tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                      <span className="text-charcoal flex items-center gap-1 bg-sage/60 px-2 py-1 rounded-md border border-border">
                        <Calendar className="w-3 h-3 text-muted" />
                        {teacher.schedule?.daysPerWeek || 3} days/wk
                      </span>

                      <span className="text-charcoal flex items-center gap-1 bg-sage/60 px-2 py-1 rounded-md border border-border">
                        <Clock className="w-3 h-3 text-muted" />
                        {teacher.schedule?.duration || 30} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & Book Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border">
                  <div className="sm:text-right mb-0 sm:mb-4">
                    <span className="text-[11px] text-muted block uppercase font-medium">
                      Monthly Package ({subject.name})
                    </span>
                    <span className="text-xl font-extrabold text-primary">
                      {rate} PKR
                    </span>
                    <span className="text-xs text-muted block">
                      / month
                    </span>
                  </div>

                  {!user ? (
                    <Link to="/login" state={{ from: bookNowUrl }}>
                      <Button variant="primary" size="sm">
                        {t("teachers.loginToBook")}
                      </Button>
                    </Link>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      {activeBooking ? (
                        <Link to="/student/bookings">
                          <span className="inline-flex items-center text-[11px] font-medium text-amber-800 bg-amber/15 border border-amber/30 px-2.5 py-1 rounded-md hover:bg-amber/25 transition-colors">
                            <Clock className="w-3.5 h-3.5 mr-1 text-amber" />
                            {isPending
                              ? t("teachers.applicationSent")
                              : t("teachers.alreadyBooked")}
                          </span>
                        </Link>
                      ) : activeTrial ? (
                        <Link
                          to="/student/bookings"
                          state={{ activeTab: "trials" }}
                        >
                          <span className="inline-flex items-center text-[11px] font-medium text-primary bg-sage border border-border px-2.5 py-1 rounded-md hover:bg-sage/80 transition-colors">
                            <Clock className="w-3.5 h-3.5 mr-1 text-primary" />
                            Trial ({activeTrial.status})
                          </span>
                        </Link>
                      ) : null}
                      <Link to={bookNowUrl}>
                        <Button variant="primary" size="sm">
                          {t("teachers.bookNow")}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  // If student is browsing in Student Portal, show with StudentLayout (Navbar sidebar visible)
  if (isStudent) {
    return (
      <StudentLayout
        title={t("teachers.pageTitle")}
        subtitle={t("teachers.pageSubtitle")}
      >
        <div className="space-y-6">
          {renderTopFilters()}
          {renderTeachersList()}
        </div>
      </StudentLayout>
    );
  }

  // Public View (Unauthenticated visitors or other roles)
  return (
    <div className="bg-ivory text-charcoal min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">
            {t("teachers.pageTitle")}
          </h1>
          <p className="text-sm text-muted mt-1">
            {t("teachers.pageSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar: Filters */}
          <aside className="lg:col-span-1">
            {renderSidebarFilters()}
          </aside>

          {/* Right Main Area: Teachers List */}
          <main className="lg:col-span-3">
            {renderTeachersList()}
          </main>
        </div>
      </div>
    </div>
  );
}
