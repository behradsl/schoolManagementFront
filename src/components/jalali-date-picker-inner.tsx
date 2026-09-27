"use client";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { toEnglishDigits } from "@/lib/format";

const fieldClass =
  "w-full rounded-md border border-line bg-paper px-3 py-2 text-ink outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-navy";

export function JalaliDatePickerInner({
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
        inputClass={fieldClass}
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
