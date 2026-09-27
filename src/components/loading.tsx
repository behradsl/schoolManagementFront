"use client";

export function Loading({
  label = "در حال بارگذاری...",
  fullScreen = false,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={
        fullScreen
          ? "fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 bg-cream/95"
          : "flex min-h-[min(28rem,70vh)] w-full flex-col items-center justify-center gap-3 py-16"
      }
      role="status"
      aria-live="polite"
    >
      <span className="inline-block size-12 animate-spin rounded-full border-4 border-navy/20 border-t-navy" />
      <span className="text-sm font-medium text-navy">{label}</span>
    </div>
  );
}
