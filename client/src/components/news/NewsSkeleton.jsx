import React from 'react';

export default function NewsSkeleton({ count = 8, variant = 'card' }) {
  if (variant === 'featured') {
    return (
      <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden animate-pulse">
        <div className="grid md:grid-cols-12 gap-0">
          <div className="md:col-span-7 aspect-[16/10] bg-[var(--color-bg-card-hover)]" />
          <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-4 w-28 bg-[var(--color-border)] rounded" />
              <div className="h-8 w-full bg-[var(--color-border)] rounded" />
              <div className="h-8 w-3/4 bg-[var(--color-border)] rounded" />
              <div className="h-4 w-full bg-[var(--color-border)] rounded mt-4" />
              <div className="h-4 w-5/6 bg-[var(--color-border)] rounded" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
              <div className="h-4 w-24 bg-[var(--color-border)] rounded" />
              <div className="h-9 w-28 bg-[var(--color-border)] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden flex flex-col animate-pulse"
        >
          <div className="aspect-[16/10] w-full bg-[var(--color-bg-card-hover)]" />
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-20 bg-[var(--color-border)] rounded" />
                <div className="h-3.5 w-14 bg-[var(--color-border)] rounded" />
              </div>
              <div className="h-5 w-full bg-[var(--color-border)] rounded" />
              <div className="h-5 w-4/5 bg-[var(--color-border)] rounded" />
              <div className="h-3.5 w-full bg-[var(--color-border)] rounded mt-2" />
            </div>
            <div className="pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
              <div className="h-3 w-16 bg-[var(--color-border)] rounded" />
              <div className="h-4 w-4 bg-[var(--color-border)] rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
