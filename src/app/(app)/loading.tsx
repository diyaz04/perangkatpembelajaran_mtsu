import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl animate-in fade-in duration-150">
      {/* Header Skeleton */}
      <div className="space-y-2 pb-4 border-b border-slate-100">
        <Skeleton className="h-8 w-64 bg-slate-100" />
        <Skeleton className="h-4 w-96 max-w-full bg-slate-50" />
      </div>

      {/* Metric / Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-xl border border-slate-200/80 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 bg-slate-100" />
              <Skeleton className="h-6 w-16 rounded-full bg-slate-100" />
            </div>
            <Skeleton className="h-7 w-36 bg-slate-100" />
            <Skeleton className="h-3 w-48 bg-slate-50" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-40 bg-slate-100" />
          <Skeleton className="h-8 w-24 rounded-lg bg-slate-100" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}
