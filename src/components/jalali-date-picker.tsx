"use client";

import dynamic from "next/dynamic";

export const JalaliDatePicker = dynamic(
  () => import("./jalali-date-picker-inner").then((mod) => mod.JalaliDatePickerInner),
  {
    ssr: false,
    loading: () => (
      <label className="block text-sm">
        <span className="mb-1.5 block h-5 w-24 rounded-md bg-line/60" />
        <span className="block h-10 w-full rounded-md border border-line bg-paper" />
      </label>
    ),
  },
);
