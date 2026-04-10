"use client";

import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[var(--color-bg-secondary)]",
        className
      )}
    />
  );
}

/** Dashboard bento grid skeleton */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-8 md:py-12">
      <div className="mb-10">
        <Bone className="h-4 w-20 mb-3" />
        <Bone className="h-12 w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Bone className="col-span-2 row-span-2 h-52 rounded-2xl" />
        <Bone className="h-24 rounded-2xl" />
        <Bone className="h-24 rounded-2xl" />
        <Bone className="h-24 rounded-2xl" />
        <Bone className="h-24 rounded-2xl" />
      </div>
      <Bone className="h-8 w-32 mb-4" />
      <div className="flex gap-2 mb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-10 w-28 rounded-xl shrink-0" />
        ))}
      </div>
      <Bone className="h-8 w-40 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Results table skeleton */
export function ResultsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
      <div className="flex justify-between mb-6">
        <div>
          <Bone className="h-8 w-56 mb-2" />
          <Bone className="h-4 w-32" />
        </div>
        <div className="flex gap-3">
          <Bone className="h-10 w-24 rounded-lg" />
          <Bone className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      <Bone className="h-12 w-full rounded-xl mb-1" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Bone key={i} className="h-16 w-full rounded-xl mb-1" />
      ))}
    </div>
  );
}

/** Lead detail skeleton */
export function LeadDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
      <Bone className="h-4 w-32 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <Bone className="h-48 rounded-xl" />
          <Bone className="h-20 rounded-xl" />
          <Bone className="h-32 rounded-xl" />
          <Bone className="h-24 rounded-xl" />
        </div>
        <div className="lg:col-span-7 space-y-6">
          <Bone className="h-36 rounded-xl" />
          <Bone className="h-80 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Settings skeleton */
export function SettingsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-12">
      <Bone className="h-12 w-40 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        <div className="space-y-2">
          <Bone className="h-10 w-full rounded-lg" />
          <Bone className="h-10 w-full rounded-lg" />
          <Bone className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Bone className="h-16 rounded-lg" />
            <Bone className="h-16 rounded-lg" />
            <Bone className="h-16 rounded-lg" />
            <Bone className="h-16 rounded-lg" />
          </div>
          <Bone className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Lists skeleton */
export function ListsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-12">
      <div className="flex justify-between mb-8">
        <div>
          <Bone className="h-8 w-32 mb-2" />
          <Bone className="h-4 w-64" />
        </div>
        <Bone className="h-10 w-28 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
