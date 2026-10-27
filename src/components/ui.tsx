"use client";

import { Children, FormEvent, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, isValidElement, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { includesQuery } from "@/lib/search";
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

export function PasswordInput(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: string },
) {
  const { label, className = "", id, ...rest } = props;
  const [visible, setVisible] = useState(false);
  return (
    <label className="block text-sm" htmlFor={id}>
      {label && <span className="mb-1.5 block text-muted">{label}</span>}
      <span className="relative block">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={cn(fieldClass, "pe-11", className)}
          {...rest}
        />
        <button
          type="button"
          className="absolute inset-e-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-navy"
          aria-label={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </span>
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

function optionLabel(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(optionLabel).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return optionLabel(node.props.children);
  return "";
}

export function Select({
  label,
  children,
  className = "",
  id,
  value,
  onChange,
  required,
  disabled,
  name,
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number; maxHeight: number; flip: boolean } | null>(null);
  const options = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode }>(child) || child.type !== "option") return [];
    return [{ value: String(child.props.value ?? ""), label: optionLabel(child.props.children) }];
  });
  const selected = options.find((option) => option.value === String(value ?? ""));
  const visible = options.filter((option) => includesQuery(query, option.label));

  function placeMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const flip = spaceBelow < 220 && spaceAbove > spaceBelow;
    setMenuStyle({
      top: flip ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(160, Math.min(320, flip ? spaceAbove : spaceBelow)),
      flip,
    });
  }

  useEffect(() => {
    if (!open) return;
    placeMenu();
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: string) {
    onChange?.({ target: { value: next }, currentTarget: { value: next } } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className="block text-sm">
      {label && <span className="mb-1.5 block text-muted" id={`${fieldId}-label`}>{label}</span>}
      <input
        className="sr-only"
        tabIndex={-1}
        name={name}
        value={String(value ?? "")}
        required={required}
        disabled={disabled}
        onChange={() => undefined}
      />
      <button
        ref={buttonRef}
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${fieldId}-label` : undefined}
        className={cn(fieldClass, "flex items-center justify-between text-start disabled:bg-slate", className)}
        onClick={() => {
          if (disabled) return;
          setQuery("");
          setOpen((current) => !current);
        }}
      >
        <span className={selected ? "text-ink" : "text-muted"}>{selected?.label || "انتخاب کنید"}</span>
        <span aria-hidden="true" className="text-muted">▾</span>
      </button>
      {open && menuStyle && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[110] overflow-hidden rounded-md border border-line bg-paper shadow-lg"
          style={{
            top: menuStyle.top,
            left: menuStyle.left,
            width: menuStyle.width,
            maxHeight: menuStyle.maxHeight,
            transform: menuStyle.flip ? "translateY(-100%)" : undefined,
          }}
        >
          <div className="border-b border-line p-2">
            <input
              autoFocus
              className={fieldClass}
              placeholder="جستجو"
              aria-label="جستجو در گزینه‌ها"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div role="listbox" className="max-h-60 overflow-y-auto p-1">
            {visible.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted">موردی یافت نشد</p>
            ) : visible.map((option) => (
              <button
                key={`${option.value}:${option.label}`}
                type="button"
                role="option"
                aria-selected={option.value === String(value ?? "")}
                className={cn(
                  "block w-full rounded-md px-2 py-2 text-start text-sm hover:bg-cream",
                  option.value === String(value ?? "") && "bg-cream font-bold text-navy",
                )}
                onClick={() => choose(option.value)}
              >
                {option.label || "—"}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
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

export function Alert({
  message,
  type = "error",
  inline = false,
  className = "",
}: {
  message?: string;
  type?: "error" | "success";
  inline?: boolean;
  className?: string;
}) {
  if (!message) return null;
  const floating = type === "error" && !inline;
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md px-3 py-2 text-sm",
        type === "error"
          ? "border border-danger/40 bg-paper font-medium text-danger"
          : "mb-3 bg-success/10 text-success",
        floating
          ? "fixed top-[4.5rem] z-[90] start-4 end-4 shadow-lg lg:start-72"
          : type === "error"
            ? "mb-3 bg-danger/10"
            : "",
        className,
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
