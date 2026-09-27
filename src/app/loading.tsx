export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 bg-cream/95" role="status">
      <span className="inline-block size-12 animate-spin rounded-full border-4 border-navy/20 border-t-navy" />
      <span className="text-sm font-medium text-navy">در حال بارگذاری سامانه...</span>
    </div>
  );
}
