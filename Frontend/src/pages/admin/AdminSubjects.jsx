import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { BookOpen, Plus, Trash2, Pencil, DollarSign, Info } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import LoadingState from "../../components/common/LoadingState";
import ErrorState from "../../components/common/ErrorState";
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../store/slices/adminSlice";

export default function AdminSubjects() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { subjects, isLoading, isError, message } = useSelector(
    (state) => state.admin,
  );

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [name, setName] = useState("");
  const [monthlyFullRate, setMonthlyFullRate] = useState(28000);
  const [gradesInput, setGradesInput] = useState(
    "Class 9, Class 10, Class 11, Class 12, O Level, A Level",
  );
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchSubjects());
  }, [dispatch]);

  const handleOpenAdd = () => {
    setName("");
    setMonthlyFullRate(28000);
    setGradesInput("Class 9, Class 10, Class 11, Class 12, O Level, A Level");
    setFormError("");
    setAddModalOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSubject(sub);
    setName(sub.name || "");
    setMonthlyFullRate(
      sub.monthlyFullRate ||
        (sub.weeklyFullRate ? sub.weeklyFullRate * 4 : 28000),
    );
    setGradesInput(
      Array.isArray(sub.grades) && sub.grades.length > 0
        ? sub.grades.join(", ")
        : "Class 9, Class 10, Class 11, Class 12, O Level, A Level",
    );
    setFormError("");
    setEditModalOpen(true);
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError(t("admin.subjectName") + " is required");
      return;
    }

    const mRateNum = Number(monthlyFullRate);
    if (!mRateNum || mRateNum <= 0) {
      setFormError("Monthly benchmark rate is required and must be greater than 0");
      return;
    }

    const grades = gradesInput
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    const res = await dispatch(
      createSubject({
        name: name.trim(),
        grades,
        monthlyFullRate: mRateNum,
        weeklyFullRate: Math.round(mRateNum / 4),
      }),
    );
    setIsSubmitting(false);

    if (res.meta.requestStatus === "fulfilled") {
      setAddModalOpen(false);
      setName("");
      setMonthlyFullRate(28000);
      dispatch(fetchSubjects());
    } else {
      setFormError(res.payload || "Failed to create subject");
    }
  };

  const handleEditSubject = async (e) => {
    e.preventDefault();
    if (!editingSubject) return;
    setFormError("");

    if (!name.trim()) {
      setFormError(t("admin.subjectName") + " is required");
      return;
    }

    const mRateNum = Number(monthlyFullRate);
    if (!mRateNum || mRateNum <= 0) {
      setFormError("Monthly benchmark rate is required and must be greater than 0");
      return;
    }

    const grades = gradesInput
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    const res = await dispatch(
      updateSubject({
        subjectId: editingSubject._id,
        data: {
          name: name.trim(),
          grades,
          monthlyFullRate: mRateNum,
          weeklyFullRate: Math.round(mRateNum / 4),
        },
      }),
    );
    setIsSubmitting(false);

    if (res.meta.requestStatus === "fulfilled") {
      setEditModalOpen(false);
      setEditingSubject(null);
      dispatch(fetchSubjects());
    } else {
      setFormError(res.payload || "Failed to update subject");
    }
  };

  const handleDelete = async (id, subName) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${subName}? Associated benchmark rates will also be removed.`,
      )
    ) {
      await dispatch(deleteSubject(id));
      dispatch(fetchSubjects());
    }
  };

  return (
    <AdminLayout
      title={t("admin.subjectsManagement")}
      subtitle="Define platform academic subjects, supported grade levels, and their benchmark rates (7 Days / 1 Hour Class)."
    >
      <div className="space-y-6">
        {/* Notice Banner */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 leading-relaxed">
            <p className="font-bold">Subject & Rate Integration:</p>
            <p className="mt-1">
              {t("admin.rateBenchmarkSyncNotice")} When creating or editing any subject,
              its benchmark rate (7 Days / 1 Hour Class in PKR) is established immediately. Teacher booking rates across the platform are auto-calculated from this benchmark.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            {t("admin.addSubject")}
          </Button>
        </div>

        {isLoading && subjects.length === 0 ? (
          <LoadingState message="Loading subjects..." />
        ) : isError ? (
          <ErrorState
            message={message}
            onRetry={() => dispatch(fetchSubjects())}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((sub) => (
              <Card key={sub._id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <h4 className="text-base font-bold text-slate-900">
                        {sub.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                        title={t("admin.editSubject")}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sub._id, sub.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Benchmark Rate Box */}
                  <div className="my-3 px-3 py-2 rounded-lg bg-blue-50/80 border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-blue-900 font-medium">
                      <DollarSign className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Monthly Benchmark Rate</span>
                    </div>
                    <span className="text-xs font-bold text-blue-700 font-mono">
                      {(sub.monthlyFullRate || (sub.weeklyFullRate ? sub.weeklyFullRate * 4 : 28000)).toLocaleString()} PKR / mo
                    </span>
                  </div>

                  {/* Grades Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {sub.grades?.map((g, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  {sub.grades?.length || 0} classes / levels configured
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Subject Modal (with Rate) */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={t("admin.addSubject")}
      >
        <form onSubmit={handleAddSubject} className="space-y-4">
          {formError && <ErrorState message={formError} />}

          <Input
            label={t("admin.subjectName")}
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mathematics, English, Biology"
            required
          />

          <Input
            label="Monthly Benchmark Rate (PKR)"
            type="number"
            min="1"
            name="monthlyFullRate"
            value={monthlyFullRate}
            onChange={(e) => setMonthlyFullRate(e.target.value)}
            placeholder="e.g. 28000"
            helperText="Benchmark rate for 7 Days / Week / 1 Hour Class for 1 Month (4 weeks). Teacher monthly rates are auto-calculated from this."
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("admin.gradesCommaSeparated")}
            </label>
            <textarea
              rows={3}
              value={gradesInput}
              onChange={(e) => setGradesInput(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAddModalOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
            >
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Subject Modal (with Rate) */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={t("admin.editSubject")}
      >
        <form onSubmit={handleEditSubject} className="space-y-4">
          {formError && <ErrorState message={formError} />}

          <Input
            label={t("admin.subjectName")}
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mathematics, English, Biology"
            required
          />

          <Input
            label="Monthly Benchmark Rate (PKR)"
            type="number"
            min="1"
            name="monthlyFullRate"
            value={monthlyFullRate}
            onChange={(e) => setMonthlyFullRate(e.target.value)}
            placeholder="e.g. 28000"
            helperText="Benchmark rate for 7 Days / Week / 1 Hour Class for 1 Month (4 weeks). Teacher monthly rates are auto-calculated from this."
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("admin.gradesCommaSeparated")}
            </label>
            <textarea
              rows={3}
              value={gradesInput}
              onChange={(e) => setGradesInput(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
            >
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
