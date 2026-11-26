import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Star, AlertTriangle, MessageSquare } from "lucide-react";
import TeacherLayout from "../../components/layout/TeacherLayout";
import Card from "../../components/common/Card";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import { fetchTeacherReviews } from "../../store/slices/teacherSlice";

export default function TeacherReviews() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const {
    reviewsData,
    isPendingApproval,
    pendingApprovalMessage,
    isLoading,
    isError,
    message,
  } = useSelector((state) => state.teacher);

  useEffect(() => {
    dispatch(fetchTeacherReviews());
  }, [dispatch]);

  const reviews = reviewsData?.reviews || [];
  const avgRating = reviewsData?.avgRating || 5.0;
  const totalReviews = reviewsData?.totalReviews || 0;

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">
            {t("teacher.reviewsTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Feedback and ratings submitted by your students after completing weekly packages
          </p>
        </div>

        {/* Section 3 Rule */}
        {isPendingApproval ? (
          <EmptyState
            icon={AlertTriangle}
            title={t("approval.pendingTitle")}
            description={
              pendingApprovalMessage || t("approval.pendingMessage")
            }
            actionText="Check Status"
            onAction={() => window.location.assign("/teacher/pending-approval")}
          />
        ) : isLoading && !reviewsData ? (
          <LoadingState message="Loading your reviews..." />
        ) : isError ? (
          <ErrorState
            message={message}
            onRetry={() => dispatch(fetchTeacherReviews())}
          />
        ) : (
          <div className="space-y-6">
            {/* Rating Summary Card */}
            <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-extrabold text-slate-900">
                  {avgRating}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(avgRating)
                            ? "text-amber-500 fill-amber-500"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Based on {totalReviews} student review{totalReviews !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </Card>

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No Reviews Yet"
                description="When your students finish their weekly packages, their reviews will appear here."
              />
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <Card key={r._id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            r.student?.picture ||
                            "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                          }
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {r.student?.fullName || "Student"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {r.booking?.subject} ({r.booking?.grade}) •{" "}
                            {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= r.rating
                                ? "text-amber-500 fill-amber-500"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 mt-1 pl-10">
                      "{r.comment}"
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
