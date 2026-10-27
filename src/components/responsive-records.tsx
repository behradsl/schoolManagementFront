"use client";

import { isValidElement, ReactNode, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui";
import { Pager, pageSlice } from "@/components/pager";
import { cn } from "@/lib/cn";
import { includesQuery } from "@/lib/search";

export type RecordColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  primary?: boolean;
};

function cellText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(cellText).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) return cellText(node.props.children);
  return "";
}

export function ResponsiveRecords<T>({
  rows,
  columns,
  rowKey,
  actions,
  empty = "موردی یافت نشد.",
  className,
  searchable = true,
}: {
  rows: T[];
  columns: RecordColumn<T>[];
  rowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
  empty?: string;
  className?: string;
  searchable?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const visible = useMemo(() => {
    if (!searchable || !query.trim()) return rows;
    return rows.filter((row) => includesQuery(query, ...columns.map((column) => cellText(column.cell(row)))));
  }, [rows, columns, query, searchable]);
  const paged = pageSlice(visible, page);
  useEffect(() => {
    setPage(1);
  }, [query]);

  if (!rows.length) {
    return (
      <div className={cn("official-card rounded-md", className)}>
        <div className="px-4 py-10 text-center text-muted">{empty}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {searchable && (
        <div className="mb-3 max-w-sm">
          <Input placeholder="جستجو در فهرست" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="جستجو در فهرست" />
        </div>
      )}
      {visible.length === 0 ? (
        <div className="official-card rounded-md">
          <div className="px-4 py-10 text-center text-muted">موردی با این جستجو یافت نشد.</div>
        </div>
      ) : (
      <>
      <div className="space-y-3 md:hidden">
        {paged.items.map((row) => {
          const title = columns.find((column) => column.primary) ?? columns[0];
          const rest = columns.filter((column) => column !== title);
          return (
            <article key={rowKey(row)} className="official-card rounded-md p-4">
              <h3 className="font-bold text-navy">{title.cell(row)}</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {rest.map((column) => (
                  <div key={column.id} className="flex items-start justify-between gap-4">
                    <dt className="text-muted">{column.header}</dt>
                    <dd className="text-end font-medium text-ink">{column.cell(row)}</dd>
                  </div>
                ))}
              </dl>
              {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions(row)}</div> : null}
            </article>
          );
        })}
      </div>
      <div className="official-card hidden overflow-hidden rounded-md md:block">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.id}>{column.header}</th>
                ))}
                {actions ? <th>عملیات</th> : null}
              </tr>
            </thead>
            <tbody>
              {paged.items.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((column) => (
                    <td key={column.id}>{column.cell(row)}</td>
                  ))}
                  {actions ? <td><div className="flex flex-wrap gap-2">{actions(row)}</div></td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pager page={paged.page} pageCount={paged.pageCount} from={paged.from} to={paged.to} total={paged.total} onPage={setPage} />
      </>
      )}
    </div>
  );
}
