"use client";

import { FormEvent, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, useState } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { toEnglishDigits } from "@/lib/format";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "gold" | "outline";
}) {
  const styles = {
    primary: "bg-navy text-white hover:bg-navy-soft",
    gold: "bg-gold text-navy hover:bg-gold-dark hover:text-white",
    ghost: "bg-transparent text-navy hover:bg-cream",
    danger: "bg-danger text-white hover:opacity-90",
    outline: "border border-line bg-white text-navy hover:bg-cream",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(
  props: InputHTMLAttributes<HTMLInputElement> & { label?: string },
) {
  const { label, className = "", ...rest } = props;
  return (
    <label className="block text-sm">
      {label && <span className="mb-1.5 block text-muted">{label}</span>}
      <input
        className={`w-full rounded-md border border-line bg-white px-3 py-2 outline-none ring-gold/30 focus:ring-2 ${className}`}
        {...rest}
      />
    </label>
  );
}

export function Textarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string },
) {
  const { label, className = "", ...rest } = props;
  return (
    <label className="block text-sm">
      {label && <span className="mb-1.5 block text-muted">{label}</span>}
      <textarea
        className={`min-h-24 w-full rounded-md border border-line bg-white px-3 py-2 outline-none ring-gold/30 focus:ring-2 ${className}`}
        {...rest}
      />
    </label>
  );
}

export function Select({
  label,
  children,
  className = "",
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1.5 block text-muted">{label}</span>}
      <select
        className={`w-full rounded-md border border-line bg-white px-3 py-2 outline-none ring-gold/30 focus:ring-2 ${className}`}
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}

export function JalaliDatePicker({
  label,
  value,
  onChange,
}: {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1.5 block text-muted">{label}</span>}
      <DatePicker
        value={value}
        calendar={persian}
        locale={persian_fa}
        format="YYYY/MM/DD"
        containerClassName="w-full"
        inputClass="w-full rounded-md border border-line bg-white px-3 py-2 outline-none ring-gold/30 focus:ring-2"
        onChange={(date) => {
          if (!date) {
            onChange("");
            return;
          }
          const formatted = Array.isArray(date) ? date[0]?.format("YYYY/MM/DD") : date.format("YYYY/MM/DD");
          onChange(toEnglishDigits(formatted || ""));
        }}
      />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4" onClick={onClose}>
      <div
        className={`official-card max-h-[90vh] w-full overflow-y-auto rounded-xl p-6 ${wide ? "max-w-5xl" : "max-w-3xl"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-lg font-bold text-navy">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-navy">
            بستن
          </button>
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
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Alert({ message, type = "error" }: { message?: string; type?: "error" | "success" }) {
  if (!message) return null;
  return (
    <div
      className={`rounded-md px-3 py-2 text-sm ${
        type === "error" ? "bg-red-50 text-danger" : "bg-emerald-50 text-success"
      }`}
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
    <label className="inline-flex cursor-pointer items-center rounded-md border border-line bg-white px-4 py-2 text-sm hover:bg-cream">
      {label}
      <input
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
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

export function useBusy() {
  const [busy, setBusy] = useState(false);
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
  return { busy, error, success, setError, setSuccess, run };
}
