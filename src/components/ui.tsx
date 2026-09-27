"use client";

import { FormEvent, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/button";

export { Button } from "@/components/button";
export { Loading } from "@/components/loading";

const fieldClass =
  "w-full rounded-md border border-line bg-paper px-3 py-2 text-ink outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-navy";

export function Input(
  props: InputHTMLAttributes<HTMLInputElement> & { label?: string },
) {
  const { label, className = "", id, ...rest } = props;
  return (
    <label className="block text-sm" htmlFor={id}>
      {label && <span className="mb-1.5 block text-muted">{label}</span>}
      <input id={id} className={cn(fieldClass, className)} {...rest} />
    </label>
  );
}

export function Textarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string },
) {
  const { label, className = "", id, ...rest } = props;
  return (
    <label className="block text-sm" htmlFor={id}>
      {label && <span className="mb-1.5 block text-muted">{label}</span>}
      <textarea id={id} className={cn("min-h-24", fieldClass, className)} {...rest} />
    </label>
  );
}

export function Select({
  label,
  children,
  className = "",
  id,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block text-sm" htmlFor={id}>
      {label && <span className="mb-1.5 block text-muted">{label}</span>}
      <select id={id} className={cn(fieldClass, className)} {...rest}>
        {children}
      </select>
    </label>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
  wide = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "official-card max-h-[90vh] w-full overflow-y-auto rounded-md p-6",
          wide ? "max-w-5xl" : "max-w-3xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
          <h3 id="dialog-title" className="text-lg font-bold text-navy">
            {title}
          </h3>
          <Button type="button" variant="ghost" onClick={onClose} aria-label="بستن">
            بستن
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold leading-8 text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm leading-7 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Alert({ message, type = "error" }: { message?: string; type?: "error" | "success" }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "mb-3 rounded-md px-3 py-2 text-sm",
        type === "error" ? "bg-danger/10 text-danger" : "bg-success/10 text-success",
      )}
    >
      {message}
    </div>
  );
}

export function FileButton({
  label,
  onFile,
}: {
  label: string;
  onFile: (file: File) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center rounded-md border border-line bg-paper px-3.5 py-2 text-sm font-medium text-navy transition-colors hover:bg-slate focus-within:ring-2 focus-within:ring-navy">
      {label}
      <input
        type="file"
        accept=".xlsx,.xls"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="py-10 text-center text-muted">{text}</div>;
}

export function FormGrid({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {children}
    </form>
  );
}

export function useBusy(initialLoading = false) {
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function run<T>(fn: () => Promise<T>, ok?: string) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await fn();
      if (ok) setSuccess(ok);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
      throw e;
    } finally {
      setBusy(false);
    }
  }
  async function loadData<T>(fn: () => Promise<T>) {
    setLoading(true);
    setError("");
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا");
      throw e;
    } finally {
      setLoading(false);
    }
  }
  return { busy, loading, error, success, setError, setSuccess, run, loadData };
}

export const statusButtonClass = {
  PRESENT: {
    active: "bg-success text-white hover:bg-success/90",
    idle: "border border-success/30 bg-paper text-success hover:bg-success/10",
  },
  ABSENT: {
    active: "bg-danger text-white hover:bg-danger/90",
    idle: "border border-danger/30 bg-paper text-danger hover:bg-danger/10",
  },
  DELAY: {
    active: "bg-warn text-white hover:bg-warn/90",
    idle: "border border-warn/30 bg-paper text-warn hover:bg-warn/10",
  },
  RUSH: {
    active: "bg-warn text-white hover:bg-warn/90",
    idle: "border border-warn/30 bg-paper text-warn hover:bg-warn/10",
  },
} as const;
