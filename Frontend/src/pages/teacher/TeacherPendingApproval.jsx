import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Clock, CheckCircle2, AlertTriangle, Calendar, User } from "lucide-react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { getMyProfile } from "../../store/slices/authSlice";

export default function TeacherPendingApproval() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getMyProfile());
  }, [dispatch]);

  // If approved, go to dashboard
  useEffect(() => {
    if (user?.teachingStatus === "approved") {
      navigate("/teacher/dashboard");
    }
  }, [user, navigate]);

  const isRejected = user?.teachingStatus === "rejected";

  return (
    <div className="bg-slate-50/40 min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-8 text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isRejected ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
            }`}
          >
            {isRejected ? (
              <AlertTriangle className="w-8 h-8" />
            ) : (
              <Clock className="w-8 h-8 animate-pulse" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isRejected
              ? t("approval.rejectedTitle")
              : t("approval.pendingTitle")}
          </h1>

          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            {isRejected
              ? t("approval.rejectedSubtitle")
              : t("approval.pendingMessage")}
          </p>

          <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Applicant:</span>
              <span className="font-semibold text-slate-800">
                {user?.fullName} ({user?.email})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Status:</span>
              <span
                className={`font-bold uppercase ${
                  isRejected ? "text-red-600" : "text-amber-600"
                }`}
              >
                {user?.teachingStatus || "pending"}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/teacher/schedule">
              <Button variant="secondary" size="md">
                <Calendar className="w-4 h-4 mr-2" />
                View Schedule
              </Button>
            </Link>
            <Link to="/teacher/profile">
              <Button variant="secondary" size="md">
                <User className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
