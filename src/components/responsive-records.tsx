"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type RecordColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  primary?: boolean;
};

export function ResponsiveRecords<T>({
  rows,
  columns,
  rowKey,
  actions,
  empty = "موردی یافت نشد.",
  className,
}: {
  rows: T[];
  columns: RecordColumn<T>[];
  rowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
  empty?: string;
  className?: string;
}) {
  if (!rows.length) {
    return (
      <div className={cn("official-card rounded-md", className)}>
        <div className="px-4 py-10 text-center text-muted">{empty}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => {
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
              {rows.map((row) => (
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
    </div>
  );
}
