"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/button";

export const PAGE_SIZE = 10;

export function pageSlice<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(page, 1), pageCount);
  const start = (current - 1) * size;
  return {
    page: current,
    pageCount,
    items: items.slice(start, start + size),
    total: items.length,
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + size, items.length),
  };
}

export function usePagedItems<T>(items: T[], resetKey: string) {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [resetKey]);
  return { ...pageSlice(items, page), setPage };
}

export function Pager({
  page,
  pageCount,
  from,
  to,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (total === 0 || pageCount <= 1) return null;
  return (
    <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted">{from} تا {to} از {total}</span>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>قبلی</Button>
        <span className="min-w-16 text-center text-navy">{page} از {pageCount}</span>
        <Button type="button" variant="outline" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>بعدی</Button>
      </div>
    </div>
  );
}
