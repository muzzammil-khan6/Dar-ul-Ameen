import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
} from "lucide-react";
import TeacherLayout from "../../components/layout/TeacherLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import ErrorState from "../../components/common/ErrorState";
import {
  fetchTeacherSchedule,
  updateTeacherSchedule,
} from "../../store/slices/teacherSlice";
import { fetchSubjects, fetchRates } from "../../store/slices/adminSlice";

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DURATION_OPTIONS = [20, 30, 40, 50, 60];

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export default function TeacherScheduleEdit() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { subjects, rates } = useSelector((state) => state.admin);
  const { schedule, isLoading } = useSelector((state) => state.teacher);
  const { user } = useSelector((state) => state.auth);

  // Draft key for localStorage
  const DRAFT_KEY = "teacher_schedule_draft";

  // Step state: 1 to 5
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");

  // Step 1: Subjects & Grades: [{ name, grades: [] }]
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [tempSubjectSelect, setTempSubjectSelect] = useState("");

  // Step 2: Days per week (1 to 7)
  const [daysPerWeek, setDaysPerWeek] = useState(3);

  // Step 3: Selected days (array of strings)
  const [selectedDays, setSelectedDays] = useState(["Monday", "Wednesday", "Friday"]);

  // Step 4: Duration (20, 30, 40, 50, 60 min)
  const [duration, setDuration] = useState(30);

  // Step 5: Time Slots: [{ day, startTime, endTime }]
  const [timeSlots, setTimeSlots] = useState([
    { day: "Monday", startTime: "16:00", endTime: "18:00" },
    { day: "Wednesday", startTime: "16:00", endTime: "18:00" },
    { day: "Friday", startTime: "16:00", endTime: "18:00" },
  ]);

  // Temporary slot form inside Step 5 (applies to all selected days)
  const [newSlot, setNewSlot] = useState({
    startTime: "16:00",
    endTime: "18:00",
  });

  // Extract distinct daily timing intervals
  const getUniqueTimings = (slots) => {
    const map = new Map();
    for (const s of slots || []) {
      if (!s.startTime || !s.endTime) continue;
      const key = `${s.startTime}-${s.endTime}`;
      if (!map.has(key)) {
        map.set(key, { startTime: s.startTime, endTime: s.endTime });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
  };

  const uniqueTimings = getUniqueTimings(timeSlots);

  // Load Admin subjects & rates
  useEffect(() => {
    dispatch(fetchSubjects());
    dispatch(fetchRates());
    dispatch(fetchTeacherSchedule());
  }, [dispatch]);

  // Load draft from localStorage on mount, or initialize with active schedule
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.selectedSubjects) setSelectedSubjects(parsed.selectedSubjects);
        if (parsed.daysPerWeek) setDaysPerWeek(parsed.daysPerWeek);
        if (parsed.selectedDays) setSelectedDays(parsed.selectedDays);
        if (parsed.duration) setDuration(parsed.duration);
        if (parsed.timeSlots) setTimeSlots(parsed.timeSlots);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        return;
      } catch (e) {
        console.error("Draft parse error", e);
      }
    }

    // Fallback to active schedule if available
    if (schedule) {
      if (schedule.subjects?.length) {
        setSelectedSubjects(
          schedule.subjects.map((s) => ({
            name: s.name,
            grades: s.grades || [],
          })),
        );
      }
      if (schedule.daysPerWeek) setDaysPerWeek(schedule.daysPerWeek);
      if (schedule.selectedDays?.length) setSelectedDays(schedule.selectedDays);
      if (schedule.duration) setDuration(schedule.duration);
      if (schedule.timeSlots?.length) {
        setTimeSlots(
          schedule.timeSlots.map((s) => ({
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        );
      }
    }
  }, [schedule]);

  // Save to draft on state change
  const saveDraft = (overrides = {}) => {
    const draftData = {
      selectedSubjects,
      daysPerWeek,
      selectedDays,
      duration,
      timeSlots,
      currentStep,
      ...overrides,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
  };

  // Helper: calculate frontend rate preview using formula
  // Monthly Rate = (Admin Rate / 7) * Days Per Week * (Duration / 60) * 4 weeks
  const calculateRatePreview = (subjectName) => {
    const rateDoc = rates?.find(
      (r) => r.subjectName.toLowerCase() === subjectName.toLowerCase(),
    );
    const weeklyFull = rateDoc?.weeklyFullRate || 7000;
    return Math.round((weeklyFull / 7) * daysPerWeek * (duration / 60) * 4);
  };

  // STEP 1 HANDLERS: Subjects & Grades
  const handleAddSubject = () => {
    if (!tempSubjectSelect) return;
    const exists = selectedSubjects.some((s) => s.name === tempSubjectSelect);
    if (exists) {
      setStepError("This subject is already added");
      return;
    }
    const subDoc = subjects.find((s) => s.name === tempSubjectSelect);
    const defaultGrade = subDoc?.grades?.[0] || "Class 9";
    const updated = [
      ...selectedSubjects,
      { name: tempSubjectSelect, grades: [defaultGrade] },
    ];
    setSelectedSubjects(updated);
    setTempSubjectSelect("");
    setStepError("");
    saveDraft({ selectedSubjects: updated });
  };

  const handleRemoveSubject = (subName) => {
    const updated = selectedSubjects.filter((s) => s.name !== subName);
    setSelectedSubjects(updated);
    saveDraft({ selectedSubjects: updated });
  };

  const handleToggleGrade = (subName, grade) => {
    const updated = selectedSubjects.map((s) => {
      if (s.name === subName) {
        const hasGrade = s.grades.includes(grade);
        const grades = hasGrade
          ? s.grades.filter((g) => g !== grade)
          : [...s.grades, grade];
        return { ...s, grades };
      }
      return s;
    });
    setSelectedSubjects(updated);
    saveDraft({ selectedSubjects: updated });
  };

  // STEP 3 HANDLER: Days Selection (Rule: Teacher can select ONLY as many days as selected in Step 2)
  const handleToggleDay = (day) => {
    setStepError("");
    let updatedDays;
    if (selectedDays.includes(day)) {
      updatedDays = selectedDays.filter((d) => d !== day);
    } else {
      if (selectedDays.length >= daysPerWeek) {
        setStepError(
          `You selected ${daysPerWeek} days per week. Uncheck a day before adding another.`,
        );
        return;
      }
      updatedDays = [...selectedDays, day];
    }
    setSelectedDays(updatedDays);

    // Keep all time slots synchronized with the new selectedDays
    const distinctTimings = getUniqueTimings(timeSlots);
    const updatedSlots = [];
    for (const d of updatedDays) {
      for (const t of distinctTimings) {
        updatedSlots.push({ day: d, startTime: t.startTime, endTime: t.endTime });
      }
    }
    setTimeSlots(updatedSlots);
    saveDraft({ selectedDays: updatedDays, timeSlots: updatedSlots });
  };

  // STEP 5 HANDLER: Add Slot (Rule: Any selected time slot is applied to every selected day)
  const handleAddSlot = () => {
    setStepError("");
    const { startTime, endTime } = newSlot;

    if (!startTime || !endTime) {
      setStepError("Please provide both start time and end time");
      return;
    }

    if (selectedDays.length === 0) {
      setStepError("Please select teaching days in Step 3 before adding slots");
      return;
    }

    const startM = timeToMinutes(startTime);
    const endM = timeToMinutes(endTime);
    const slotDuration = endM - startM;

    // Rule: Slot Duration MUST be MORE than Step 4 Duration
    if (slotDuration <= duration) {
      setStepError(
        `Slot duration (${slotDuration} mins) must be MORE than class duration (${duration} mins). E.g. ${duration + 20} mins or more.`,
      );
      return;
    }

    // Overlap validation across existing unique timings
    const existingTimings = getUniqueTimings(timeSlots);
    for (const t of existingTimings) {
      const sStart = timeToMinutes(t.startTime);
      const sEnd = timeToMinutes(t.endTime);
      if (Math.max(startM, sStart) < Math.min(endM, sEnd)) {
        setStepError(
          `This time slot already exists or overlaps with existing timing (${t.startTime} - ${t.endTime})`,
        );
        return;
      }
    }

    // Apply this time slot to EVERY day in selectedDays
    const newSlotsForDays = selectedDays.map((day) => ({
      day,
      startTime,
      endTime,
    }));

    const updated = [...timeSlots, ...newSlotsForDays];
    setTimeSlots(updated);
    saveDraft({ timeSlots: updated });
  };

  const handleDeleteTiming = (startTime, endTime) => {
    // Remove this time slot from ALL days
    const updated = timeSlots.filter(
      (s) => !(s.startTime === startTime && s.endTime === endTime),
    );
    setTimeSlots(updated);
    saveDraft({ timeSlots: updated });
  };

  // NAVIGATION VALIDATION
  const handleNextStep = () => {
    setStepError("");

    // Step 1 Validation: At least 1 Subject + 1 Grade required
    if (currentStep === 1) {
      if (selectedSubjects.length === 0) {
        setStepError("At least 1 subject is required");
        return;
      }
      for (const s of selectedSubjects) {
        if (!s.grades || s.grades.length === 0) {
          setStepError(`Please select at least 1 grade for ${s.name}`);
          return;
        }
      }
    }

    // Step 2 Validation: Days per week
    if (currentStep === 2) {
      if (!daysPerWeek || daysPerWeek < 1 || daysPerWeek > 7) {
        setStepError("Please select days per week between 1 and 7");
        return;
      }
    }

    // Step 3 Validation: Selected Days must match daysPerWeek
    if (currentStep === 3) {
      if (selectedDays.length !== daysPerWeek) {
        setStepError(
          `You selected ${daysPerWeek} days per week, but have checked ${selectedDays.length} days.`,
        );
        return;
      }
    }

    // Step 4 Validation: Duration
    if (currentStep === 4) {
      if (!DURATION_OPTIONS.includes(Number(duration))) {
        setStepError("Please select a valid duration");
        return;
      }
    }

    const next = currentStep + 1;
    setCurrentStep(next);
    saveDraft({ currentStep: next });
  };

  const handlePrevStep = () => {
    setStepError("");
    const prev = currentStep - 1;
    setCurrentStep(prev);
    saveDraft({ currentStep: prev });
  };

  // FINAL SUBMISSION (Save & Submit for Approval)
  const handleSubmitSchedule = async () => {
    setStepError("");

    const distinctTimings = getUniqueTimings(timeSlots);
    if (distinctTimings.length === 0) {
      setStepError(
        t("schedule.slotRequiredPerDay") ||
          "Please add at least one time slot before submitting",
      );
      return;
    }

    if (selectedDays.length === 0) {
      setStepError("Please select teaching days before submitting schedule");
      return;
    }

    // Ensure every selected time slot is applied to every selected day
    const synchronizedSlots = [];
    for (const day of selectedDays) {
      for (const t of distinctTimings) {
        synchronizedSlots.push({
          day,
          startTime: t.startTime,
          endTime: t.endTime,
        });
      }
    }

    const payload = {
      subjects: selectedSubjects,
      daysPerWeek,
      selectedDays,
      duration,
      timeSlots: synchronizedSlots,
    };

    const res = await dispatch(updateTeacherSchedule(payload));
    if (res.meta.requestStatus === "fulfilled") {
      localStorage.removeItem(DRAFT_KEY);
      // Teachers' status is not changed to pending after schedule changes.
      // If the teacher is already approved, direct them to their Schedule View page.
      if (user?.teachingStatus === "approved") {
        navigate("/teacher/schedule");
      } else {
        navigate("/teacher/pending-approval");
      }
    } else {
      setStepError(res.payload || "Failed to save schedule");
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">
            {t("schedule.wizardTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure your teaching preferences step-by-step. Draft is saved automatically.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`p-2 rounded-lg text-center transition-all ${
                currentStep === s
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : currentStep > s
                  ? "bg-blue-100 text-blue-800 font-semibold"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <span className="text-[10px] uppercase block">Step {s}</span>
              <span className="text-xs truncate block">
                {s === 1
                  ? "Subjects"
                  : s === 2
                  ? "Days/Wk"
                  : s === 3
                  ? "Days"
                  : s === 4
                  ? "Duration"
                  : "Slots"}
              </span>
            </div>
          ))}
        </div>

        {stepError && <ErrorState message={stepError} className="my-2" />}

        {/* STEP 1: SUBJECT SELECT */}
        {currentStep === 1 && (
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t("schedule.step1Title")}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select the subjects you teach from the dropdown (Admin list only, text input not allowed). Choose applicable grades.
              </p>
            </div>

            {/* Subject Dropdown & Add Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={tempSubjectSelect}
                onChange={(e) => setTempSubjectSelect(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Subject to Add --</option>
                {subjects?.map((sub) => (
                  <option key={sub._id} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>

              <Button
                variant="primary"
                onClick={handleAddSubject}
                disabled={!tempSubjectSelect}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Subject
              </Button>
            </div>

            {/* Added Subjects List with Grade Checkboxes */}
            <div className="space-y-4">
              {selectedSubjects.map((sub) => {
                const subDoc = subjects?.find((s) => s.name === sub.name);
                const availableGrades = subDoc?.grades || [
                  "Class 9",
                  "Class 10",
                  "Class 11",
                  "Class 12",
                  "O Level",
                  "A Level",
                ];

                return (
                  <div
                    key={sub.name}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">
                        {sub.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sub.name)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>

                    <div>
                      <span className="text-xs text-slate-600 block mb-2 font-medium">
                        Select Grades / Classes:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {availableGrades.map((g) => {
                          const isChecked = sub.grades.includes(g);
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => handleToggleGrade(sub.name, g)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                isChecked
                                  ? "bg-blue-600 text-white font-semibold"
                                  : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* STEP 2: DAYS PER WEEK SELECT */}
        {currentStep === 2 && (
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t("schedule.step2Title")}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {t("schedule.step2Question")}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setDaysPerWeek(num);
                    saveDraft({ daysPerWeek: num });
                  }}
                  className={`p-4 rounded-xl border text-center font-bold text-lg transition-all cursor-pointer ${
                    daysPerWeek === num
                      ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500 shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {num}
                  <span className="block text-[10px] font-normal text-slate-500">
                    Day{num > 1 ? "s" : ""} / wk
                  </span>
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
              You selected <span className="font-bold">{daysPerWeek} days per week</span>. The next step will require you to pick exactly {daysPerWeek} days.
            </div>
          </Card>
        )}

        {/* STEP 3: DAYS SELECT */}
        {currentStep === 3 && (
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t("schedule.step3Title")}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Check the {daysPerWeek} days you are available to teach. You can only select as many days as chosen in Step 2.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500 shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-sm font-semibold">{day}</span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "border border-slate-300 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Selected: <span className="font-bold text-slate-900">{selectedDays.length}</span> of {daysPerWeek} days ({selectedDays.join(", ")})
            </p>
          </Card>
        )}

        {/* STEP 4: TIME DURATION SELECT + AUTOMATIC RATE */}
        {currentStep === 4 && (
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t("schedule.step4Title")}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {t("schedule.step4Question")}
              </p>
            </div>

            {/* Duration Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {DURATION_OPTIONS.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => {
                    setDuration(dur);
                    saveDraft({ duration: dur });
                  }}
                  className={`p-3.5 rounded-xl border text-center font-bold text-base transition-all cursor-pointer ${
                    duration === dur
                      ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500 shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {dur}
                  <span className="block text-[10px] font-normal text-slate-500">
                    Minutes
                  </span>
                </button>
              ))}
            </div>

            {/* Automatic Calculated Rate Box per Subject */}
            <div className="p-5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-700" />
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  {t("schedule.autoRateNotice")}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {selectedSubjects.map((sub) => {
                  const rate = calculateRatePreview(sub.name);
                  return (
                    <div
                      key={sub.name}
                      className="p-3 bg-white rounded-lg border border-blue-200 flex items-center justify-between shadow-xs"
                    >
                      <span className="text-xs font-bold text-slate-800">
                        {sub.name}
                      </span>
                      <div className="text-right">
                        <span className="text-base font-extrabold text-blue-600">
                          {rate} PKR
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          / month ({daysPerWeek * 4} classes)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Formula: Monthly Rate = (Admin Rate / 7) * Days Per Week ({daysPerWeek}) * (Duration ({duration}) / 60) * 4 weeks. Rates are display-only and enforced by Admin platform standard.
              </p>
            </div>
          </Card>
        )}

        {/* STEP 5: SCHEDULE / TIME SLOTS */}
        {currentStep === 5 && (
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t("schedule.step5Title")}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t("schedule.ruleAppliedToAllDaysNotice")} {t("schedule.slotDurationError")} ({duration} mins).
              </p>
            </div>

            {/* Rule Callout Banner */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-900">
                  {t("schedule.ruleAppliedToAllDaysNotice")}
                </span>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  {t("schedule.dailyTimingsSubtitle", { count: selectedDays.length })}: <span className="font-semibold">{selectedDays.join(", ")}</span>.
                </p>
              </div>
            </div>

            {/* Add Slot Form */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase">
                {t("schedule.addSlotToAllDays")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {t("schedule.startTime")}
                  </label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    {t("schedule.endTime")}
                  </label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddSlot}
                    className="w-full h-9"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {t("schedule.addSlotToAllDays")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Configured Daily Timings List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {t("schedule.dailyTimingsTitle")}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {t("schedule.dailyTimingsSubtitle", { count: selectedDays.length })}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {uniqueTimings.length} {uniqueTimings.length === 1 ? "Timing" : "Timings"}
                </span>
              </div>

              {uniqueTimings.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-medium">
                    {t("schedule.noTimingsConfigured")}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Slot duration must be more than {duration} mins.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {uniqueTimings.map((timing, idx) => {
                    let gapWithNext = null;
                    if (idx < uniqueTimings.length - 1) {
                      const next = uniqueTimings[idx + 1];
                      if (timing.endTime < next.startTime) {
                        gapWithNext = `${timing.endTime} - ${next.startTime}`;
                      }
                    }

                    return (
                      <React.Fragment key={`${timing.startTime}-${timing.endTime}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-sm text-slate-900">
                              {timing.startTime} — {timing.endTime}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              {t("schedule.appliedToAllDays", {
                                count: selectedDays.length,
                                days: selectedDays.join(", "),
                              })}
                            </span>
                          </div>
                          <button
                            type="button"
                            title={t("schedule.deleteSlotFromAll")}
                            onClick={() =>
                              handleDeleteTiming(timing.startTime, timing.endTime)
                            }
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {gapWithNext && (
                          <div className="p-2 px-3 rounded-md bg-amber-50 text-amber-800 border border-dashed border-amber-200 text-xs flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              {t("schedule.gap")}: {gapWithNext}
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Weekly Timetable Breakdown Preview */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {t("schedule.weeklyBreakdown")}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {selectedDays.map((day) => {
                  const daySlots = timeSlots
                    .filter((s) => s.day === day)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));

                  return (
                    <div
                      key={day}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase">
                          {day}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {daySlots.length} slot(s)
                        </span>
                      </div>

                      <div className="space-y-1">
                        {daySlots.length === 0 ? (
                          <span className="text-[11px] text-amber-700 italic">
                            {t("schedule.noTimingsConfigured")}
                          </span>
                        ) : (
                          daySlots.map((slot, sIdx) => (
                            <div
                              key={sIdx}
                              className="px-2 py-1 bg-white rounded border border-slate-200 text-[11px] font-mono font-medium text-slate-700"
                            >
                              {slot.startTime} — {slot.endTime}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div>
            {currentStep > 1 && (
              <Button
                variant="secondary"
                size="md"
                onClick={handlePrevStep}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Previous Step
              </Button>
            )}
          </div>

          <div>
            {currentStep < 5 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNextStep}
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                loading={isLoading}
                onClick={handleSubmitSchedule}
              >
                <Save className="w-4 h-4 mr-1.5" />
                {user?.teachingStatus === "approved"
                  ? t("schedule.saveChanges")
                  : t("schedule.saveAndSubmit")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
