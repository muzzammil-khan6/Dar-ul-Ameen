// Job: Teacher Schedule View page composing 2 tabs (Subjects & Rates vs Days & Slots), TeacherSubjectCard, TeacherDaysSection, and TeacherSlotsSection
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Clock,
  BookOpen,
  Edit,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
  Layers,
} from "lucide-react";
import TeacherLayout from "../../components/layout/TeacherLayout";
import TeacherSubjectCard from "../../components/organisms/TeacherSubjectCard";
import TeacherDaysSection from "../../components/organisms/TeacherDaysSection";
import TeacherSlotsSection from "../../components/organisms/TeacherSlotsSection";
import Modal from "../../components/organisms/Modal";
import FormField from "../../components/molecules/FormField";
import Button from "../../components/atoms/Button";
import EmptyState from "../../components/atoms/EmptyState";
import Loader from "../../components/atoms/Loader";
import {
  fetchTeacherSchedule,
  addOrUpdateSubjectCard,
  deleteSubjectCard,
  updateTeacherDays,
  addScheduleSlot,
  deleteScheduleSlot,
} from "../../store/slices/teacherSlice";
import { fetchSubjects } from "../../store/slices/adminSlice";

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

const GRADE_OPTIONS = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11 / Matric",
  "Grade 12 / Intermediate",
  "O-Levels",
  "A-Levels",
];

const POPULAR_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Urdu",
  "Computer Science",
  "Islamiat",
  "Pakistan Studies",
  "General Science",
  "Accounting",
  "Economics",
];

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function getUniqueTimeSlots(slots) {
  const map = new Map();
  for (const s of slots || []) {
    if (!s.startTime || !s.endTime) continue;
    const key = `${s.startTime}-${s.endTime}`;
    if (!map.has(key)) {
      map.set(key, { _id: s._id, startTime: s.startTime, endTime: s.endTime });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export default function TeacherScheduleView() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { schedule, isLoading } = useSelector((state) => state.teacher);
  const { subjects: adminSubjects } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState("subjects"); // "subjects" | "days-slots"
  const [feedback, setFeedback] = useState(null);

  // Modal States
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isEditCardOpen, setIsEditCardOpen] = useState(false);
  const [isEditDaysOpen, setIsEditDaysOpen] = useState(false);
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subject Card Form State
  const [cardFormSubject, setCardFormSubject] = useState("");
  const [cardFormCustomSubject, setCardFormCustomSubject] = useState("");
  const [cardFormGrades, setCardFormGrades] = useState([]);
  const [cardFormDuration, setCardFormDuration] = useState(30);

  // Days Form State
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [selectedDays, setSelectedDays] = useState(["Monday", "Wednesday", "Friday"]);

  // Time Slot Form State
  const [slotStartTime, setSlotStartTime] = useState("16:00");
  const [slotEndTime, setSlotEndTime] = useState("18:00");
  const [slotError, setSlotError] = useState("");

  useEffect(() => {
    dispatch(fetchTeacherSchedule());
    dispatch(fetchSubjects());
  }, [dispatch]);

  useEffect(() => {
    if (schedule) {
      if (schedule.daysPerWeek) setDaysPerWeek(schedule.daysPerWeek);
      if (schedule.selectedDays?.length) setSelectedDays(schedule.selectedDays);
      if (schedule.duration) setCardFormDuration(schedule.duration);
    }
  }, [schedule]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const availableSubjectNames = Array.from(
    new Set([...POPULAR_SUBJECTS, ...(adminSubjects || []).map((s) => s.name || s)])
  );

  const uniqueTimeSlots = getUniqueTimeSlots(schedule?.timeSlots);
  const bookedSlots = schedule?.bookedSlots || [];

  const getSubjectRate = (sub) => {
    if (sub?.rate && Number(sub.rate) > 0) return Number(sub.rate);
    const found = schedule?.rates?.find(
      (r) => r.subjectName?.toLowerCase() === sub?.name?.toLowerCase(),
    );
    return found?.calculatedRate || 1500;
  };

  // ==================== HANDLERS: TAB 1 SUBJECT CARDS ====================
  const handleOpenAddCard = () => {
    setCardFormSubject(availableSubjectNames[0] || "Mathematics");
    setCardFormCustomSubject("");
    setCardFormGrades(["Grade 9", "Grade 10"]);
    setCardFormDuration(schedule?.duration || 30);
    setIsAddCardOpen(true);
  };

  const handleOpenEditCard = (sub) => {
    setCardFormSubject(sub.name);
    setCardFormCustomSubject("");
    setCardFormGrades(sub.grades || []);
    setCardFormDuration(schedule?.duration || 30);
    setIsEditCardOpen(true);
  };

  const toggleGrade = (grade) => {
    if (cardFormGrades.includes(grade)) {
      setCardFormGrades(cardFormGrades.filter((g) => g !== grade));
    } else {
      setCardFormGrades([...cardFormGrades, grade]);
    }
  };

  const handleSaveSubjectCard = async (e) => {
    e.preventDefault();
    const finalSubjectName =
      cardFormSubject === "OTHER_CUSTOM" ? cardFormCustomSubject.trim() : cardFormSubject.trim();

    if (!finalSubjectName) {
      setFeedback({ type: "error", message: "Please specify a subject name" });
      return;
    }
    if (cardFormGrades.length === 0) {
      setFeedback({ type: "error", message: "Please select at least one grade level" });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await dispatch(
        addOrUpdateSubjectCard({
          name: finalSubjectName,
          grades: cardFormGrades,
          duration: cardFormDuration,
        })
      ).unwrap();

      setFeedback({
        type: "success",
        message: res.message || `Subject card "${finalSubjectName}" saved successfully!`,
      });
      setIsAddCardOpen(false);
      setIsEditCardOpen(false);
    } catch (err) {
      setFeedback({
        type: "error",
        message: typeof err === "string" ? err : err?.message || "Failed to save subject card",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubjectCard = async (subjectName) => {
    if (!window.confirm(`Are you sure you want to delete "${subjectName}"?`)) return;
    try {
      setIsSubmitting(true);
      const res = await dispatch(deleteSubjectCard(subjectName)).unwrap();
      setFeedback({
        type: "success",
        message: res.message || `Subject "${subjectName}" deleted successfully!`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: typeof err === "string" ? err : err?.message || "Failed to delete subject card",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== HANDLERS: TAB 2 DAYS & TIME SLOTS ====================
  const handleOpenEditDays = () => {
    setDaysPerWeek(schedule?.daysPerWeek || 3);
    setSelectedDays(schedule?.selectedDays || ["Monday", "Wednesday", "Friday"]);
    setIsEditDaysOpen(true);
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      if (selectedDays.length >= daysPerWeek) {
        setSelectedDays([...selectedDays.slice(1), day]);
      } else {
        setSelectedDays([...selectedDays, day]);
      }
    }
  };

  const handleSaveDays = async (e) => {
    e.preventDefault();
    if (selectedDays.length !== Number(daysPerWeek)) {
      setFeedback({
        type: "error",
        message: `Please select exactly ${daysPerWeek} days to match your Days per Week selection.`,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await dispatch(
        updateTeacherDays({
          daysPerWeek: Number(daysPerWeek),
          selectedDays,
        })
      ).unwrap();

      setFeedback({
        type: "success",
        message: res.message || "Teaching days updated successfully!",
      });
      setIsEditDaysOpen(false);
    } catch (err) {
      setFeedback({
        type: "error",
        message: typeof err === "string" ? err : err?.message || "Failed to update days",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTimeSlot = async (e) => {
    e.preventDefault();
    setSlotError("");

    if (!slotStartTime || !slotEndTime) {
      setSlotError("Start time and end time are required");
      return;
    }
    const startMin = timeToMinutes(slotStartTime);
    const endMin = timeToMinutes(slotEndTime);
    const slotDuration = endMin - startMin;

    if (slotDuration <= 0) {
      setSlotError("End time must be after start time");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await dispatch(
        addScheduleSlot({
          startTime: slotStartTime,
          endTime: slotEndTime,
        })
      ).unwrap();

      setFeedback({
        type: "success",
        message: res.message || "Time slot added successfully across all teaching days!",
      });
      setIsAddSlotOpen(false);
    } catch (err) {
      setSlotError(typeof err === "string" ? err : err?.message || "Failed to add time slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTimeSlot = async (slotId) => {
    if (!window.confirm("Are you sure you want to delete this time slot?")) return;
    try {
      setIsSubmitting(true);
      const res = await dispatch(deleteScheduleSlot(slotId)).unwrap();
      setFeedback({
        type: "success",
        message: res.message || "Time slot deleted successfully!",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: typeof err === "string" ? err : err?.message || "Failed to delete time slot",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TeacherLayout
        title={t("Teacher Schedule & Subject Cards") || "My 1v1 Classes"}
        subtitle={t("Configure your subjects, hourly rates, working days, and time slots.")}
      >
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:hidden sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="sm:hidden">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 tracking-tight">
              <Calendar className="w-6 h-6 text-primary" />
              Teacher Schedule & Subject Cards
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure your subjects, hourly rates, working days, and time slots.
            </p>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-xl flex items-start justify-between gap-3 text-sm transition-all ${
              feedback.type === "success"
                ? "bg-sage text-primary border border-border"
                : "bg-rose-50 text-rose-900 border border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-muted hover:text-charcoal p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2 Main Tabs: [Subjects & Rates Cards] | [Days & Time Slots] */}
        <div className="flex items-center gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("subjects")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "subjects"
                ? "border-primary text-primary bg-white shadow-2xs"
                : "border-transparent text-muted hover:text-charcoal"
            }`}
          >
            <BookOpen className="w-4 h-4 text-primary" />
            Subjects & Rates Cards
            {schedule?.subjects?.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-sage text-primary font-bold">
                {schedule.subjects.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("days-slots")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "days-slots"
                ? "border-primary text-primary bg-white shadow-2xs"
                : "border-transparent text-muted hover:text-charcoal"
            }`}
          >
            <Layers className="w-4 h-4 text-primary" />
            Days & Time Slots
            {uniqueTimeSlots.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-sage text-primary font-bold">
                {uniqueTimeSlots.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Tabs */}
        {isLoading && !schedule ? (
          <Loader text="Loading schedule..." className="py-20" />
        ) : activeTab === "subjects" ? (
          /* TAB 1: Subjects, Rate & Duration Cards */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-medium">
                Subject cards offered with rates and standard class duration.
              </span>
              <Button size="sm" variant="primary" onClick={handleOpenAddCard}>
                <Plus className="w-4 h-4 mr-1.5" /> Add Subject Card
              </Button>
            </div>

            {!schedule?.subjects || schedule.subjects.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No Subject Cards Configured"
                description="Add your first subject card with rates and duration to allow students to book sessions."
                actionLabel="Add Subject Card"
                onAction={handleOpenAddCard}
                className="py-12"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedule.subjects.map((sub) => (
                  <TeacherSubjectCard
                    key={sub._id || sub.name}
                    subject={{
                      ...sub,
                      rate: getSubjectRate(sub),
                    }}
                    duration={schedule.duration || 30}
                    onEdit={handleOpenEditCard}
                    onDelete={handleDeleteSubjectCard}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: Days & Time Slots */
          <div className="space-y-6">
            <TeacherDaysSection
              daysPerWeek={daysPerWeek}
              selectedDays={selectedDays}
              onEditDays={handleOpenEditDays}
            />

            <TeacherSlotsSection
              timeSlots={uniqueTimeSlots}
              bookedSlots={bookedSlots}
              onAddSlot={() => {
                setSlotStartTime("16:00");
                setSlotEndTime("18:00");
                setSlotError("");
                setIsAddSlotOpen(true);
              }}
              onDeleteSlot={handleDeleteTimeSlot}
            />
          </div>
        )}
      </div>

      {/* Add / Edit Subject Card Modal */}
      <Modal
        isOpen={isAddCardOpen || isEditCardOpen}
        onClose={() => {
          setIsAddCardOpen(false);
          setIsEditCardOpen(false);
        }}
        title={isAddCardOpen ? "Add Subject Card" : "Edit Subject Card"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveSubjectCard} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">
              Select Subject
            </label>
            <select
              value={cardFormSubject}
              onChange={(e) => setCardFormSubject(e.target.value)}
              className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs text-charcoal outline-none focus:ring-2 focus:ring-primary/40"
            >
              {availableSubjectNames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="OTHER_CUSTOM">+ Other / Custom Subject</option>
            </select>
          </div>

          {cardFormSubject === "OTHER_CUSTOM" && (
            <FormField
              label="Custom Subject Name"
              type="text"
              value={cardFormCustomSubject}
              onChange={(e) => setCardFormCustomSubject(e.target.value)}
              placeholder="e.g. Arabic Grammar"
              required
            />
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">
              Class Duration
            </label>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setCardFormDuration(d)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    cardFormDuration === d
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-charcoal border-border hover:bg-sage/40"
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">
              Offered Grades
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-ivory rounded-xl border border-border">
              {GRADE_OPTIONS.map((g) => {
                const selected = cardFormGrades.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGrade(g)}
                    className={`px-2 py-1 rounded text-[11px] text-left transition-colors cursor-pointer ${
                      selected
                        ? "bg-primary text-white font-bold"
                        : "hover:bg-sage text-charcoal bg-white border border-border/50"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              size="md"
              variant="outline"
              type="button"
              onClick={() => {
                setIsAddCardOpen(false);
                setIsEditCardOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="md"
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
            >
              Save Subject Card
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Days Modal */}
      <Modal
        isOpen={isEditDaysOpen}
        onClose={() => setIsEditDaysOpen(false)}
        title="Edit Teaching Days"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveDays} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">
              Days per Week
            </label>
            <select
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs text-charcoal outline-none focus:ring-2 focus:ring-primary/40"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <option key={num} value={num}>
                  {num} day{num > 1 ? "s" : ""} per week
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal block">
              Select Working Days (Choose exactly {daysPerWeek})
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_DAYS.map((d) => {
                const active = selectedDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      active
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-charcoal border-border hover:bg-sage/40"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              size="md"
              variant="outline"
              type="button"
              onClick={() => setIsEditDaysOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="md"
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
            >
              Save Days
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Time Slot Modal */}
      <Modal
        isOpen={isAddSlotOpen}
        onClose={() => setIsAddSlotOpen(false)}
        title="Add Teaching Time Slot"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveTimeSlot} className="space-y-4">
          {slotError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{slotError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Start Time"
              type="time"
              value={slotStartTime}
              onChange={(e) => setSlotStartTime(e.target.value)}
              required
            />
            <FormField
              label="End Time"
              type="time"
              value={slotEndTime}
              onChange={(e) => setSlotEndTime(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              size="md"
              variant="outline"
              type="button"
              onClick={() => setIsAddSlotOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="md"
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
            >
              Add Time Slot
            </Button>
          </div>
        </form>
      </Modal>
    </TeacherLayout>
  );
}
