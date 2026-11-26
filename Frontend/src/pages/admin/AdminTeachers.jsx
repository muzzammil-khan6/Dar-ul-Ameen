import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Check,
  X,
  Ban,
  ShieldCheck,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import LoadingState from "../../components/common/LoadingState";
import ErrorState from "../../components/common/ErrorState";
import {
  fetchAdminTeachers,
  approveTeacher,
  rejectTeacher,
  toggleBlockTeacher,
} from "../../store/slices/adminSlice";

export default function AdminTeachers() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { teachers, isLoading, isError, message } = useSelector(
    (state) => state.admin,
  );

  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    dispatch(fetchAdminTeachers());
  }, [dispatch]);

  const handleApprove = async (id) => {
    await dispatch(approveTeacher(id));
    dispatch(fetchAdminTeachers());
  };

  const handleReject = async (id) => {
    if (window.confirm("Are you sure you want to reject this teacher request?")) {
      await dispatch(rejectTeacher(id));
      dispatch(fetchAdminTeachers());
    }
  };

  const handleToggleBlock = async (id) => {
    await dispatch(toggleBlockTeacher(id));
    dispatch(fetchAdminTeachers());
  };

  return (
    <AdminLayout>
      {isLoading && teachers.length === 0 ? (
        <LoadingState message="Loading teachers..." />
      ) : isError ? (
        <ErrorState
          message={message}
          onRetry={() => dispatch(fetchAdminTeachers())}
        />
      ) : (
            <Card className="p-6">
              <div>
                <h1 className="block text-base font-bold text-charcoal leading-tight">
                  {t("admin.teachersManagement")}
                </h1>
                <p className="text-[11px] text-muted block">
                  {"Approve or reject applicant requests, block or unblock accounts, and view teacher schedules"}
                </p>
              </div> 
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Teacher</th>
                  <th className="py-3 px-3">Contact & City</th>
                  <th className="py-3 px-3">Subjects / Schedule</th>
                  <th className="py-3 px-3">Approval Status</th>
                  <th className="py-3 px-3">Account State</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((teacher) => {
                  const isPending = teacher.teachingStatus === "pending";
                  const isApproved = teacher.teachingStatus === "approved";
                  const isBlocked = teacher.isBlocked;

                  return (
                    <tr key={teacher._id} className="hover:bg-slate-50/50">
                      {/* Teacher Column */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              teacher.picture ||
                              "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                            }
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {teacher.fullName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {teacher.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact & City */}
                      <td className="py-3 px-3 text-slate-600">
                        <div>
                          <span>
                            {teacher.phone || teacher.phoneNumber || "No phone"}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {teacher.city || "—"}, {teacher.country || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Subjects & Schedule */}
                      <td className="py-3 px-3">
                        {teacher.schedule ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {teacher.schedule.subjects?.map((s, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700"
                                >
                                  {s.name}
                                </span>
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              {teacher.schedule.daysPerWeek} days/wk • {teacher.schedule.duration} min
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            No schedule
                          </span>
                        )}
                      </td>

                      {/* Approval Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isApproved
                              ? "bg-green-100 text-green-800"
                              : isPending
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {teacher.teachingStatus}
                        </span>
                      </td>

                      {/* Account State */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isBlocked
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isBlocked ? t("common.blocked") : t("common.active")}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            type="button"
                            onClick={() => setSelectedTeacher(teacher)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Approve (Keep 3 Admin controllers as they are) */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(teacher._id)}
                                className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg cursor-pointer"
                                title="Approve Teacher"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(teacher._id)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="Reject Teacher"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Block / Unblock (Separate feature) */}
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(teacher._id)}
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              isBlocked
                                ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                                : "text-red-500 hover:text-red-700 hover:bg-red-50"
                            }`}
                            title={isBlocked ? "Unblock Teacher" : "Block Teacher"}
                          >
                            {isBlocked ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* View Teacher Details Modal */}
      <Modal
        isOpen={Boolean(selectedTeacher)}
        onClose={() => setSelectedTeacher(null)}
        title="Teacher Profile & Schedule Overview"
        maxWidth="max-w-xl"
      >
        {selectedTeacher && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <img
                src={
                  selectedTeacher.picture ||
                  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                }
                alt=""
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {selectedTeacher.fullName}
                </h4>
                <p className="text-xs text-slate-500">
                  {selectedTeacher.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                    Status: {selectedTeacher.teachingStatus}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {selectedTeacher.isBlocked ? "Blocked" : "Active"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block uppercase">Phone</span>
                <span className="font-semibold text-slate-800">
                  {selectedTeacher.phone || selectedTeacher.phoneNumber || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">City, Country</span>
                <span className="font-semibold text-slate-800">
                  {selectedTeacher.city || "—"}, {selectedTeacher.country || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Preferred Language</span>
                <span className="font-semibold text-slate-800">
                  {selectedTeacher.preferredLanguage || "English"}
                </span>
              </div>
            </div>

            {selectedTeacher.bio && (
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Bio / Introduction
                </span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed">
                  {selectedTeacher.bio}
                </p>
              </div>
            )}

            {/* Schedule View in Modal */}
            {selectedTeacher.schedule && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Configured Schedule
                </span>
                <div className="p-3 bg-blue-50/40 rounded-lg border border-blue-100 text-xs space-y-2">
                  <p>
                    <strong>Teaching Days:</strong>{" "}
                    {selectedTeacher.schedule.selectedDays?.join(", ")} (
                    {selectedTeacher.schedule.daysPerWeek} days/wk)
                  </p>
                  <p>
                    <strong>Duration:</strong> {selectedTeacher.schedule.duration} mins
                  </p>
                  <div>
                    <strong>Subjects & Calculated Rates:</strong>
                    <div className="mt-1 space-y-1">
                      {selectedTeacher.schedule.rates?.map((r, i) => (
                        <div key={i} className="flex justify-between font-mono">
                          <span>{r.subjectName}</span>
                          <span className="font-bold text-blue-700">
                            {r.calculatedRate} PKR / month
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedTeacher(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
