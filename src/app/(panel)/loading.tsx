export default function PanelLoading() {
  return (
    <div className="flex min-h-[min(28rem,70vh)] w-full flex-col items-center justify-center gap-3 py-16" role="status">
      <span className="inline-block size-12 animate-spin rounded-full border-4 border-navy/20 border-t-navy" />
      <span className="text-sm font-medium text-navy">در حال بارگذاری صفحه...</span>
    </div>
  );
}
