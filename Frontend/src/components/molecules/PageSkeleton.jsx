// Job: Full page loading skeleton fallback molecule for Suspense & initial data load
import { memo } from "react";
import Skeleton from "../atoms/Skeleton";

function PageSkeleton({ count = 3, showHeader = true }) {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      )}

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 bg-white border border-slate-200/70 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-6 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Main List / Table Skeletons */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-36 rounded-md" />
        <div className="space-y-3">
          {[...Array(count)].map((_, i) => (
            <div
              key={i}
              className="p-5 bg-white border border-slate-200/70 rounded-2xl flex items-center justify-between gap-4 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(PageSkeleton);
