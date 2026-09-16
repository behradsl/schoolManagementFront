import * as jalaali from "jalaali-js";

export function toEnglishDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function todayJalali() {
  const now = new Date();
  const j = jalaali.toJalaali(now);
  return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
}

export function jalaliMeta(dateStr?: string) {
  if (!dateStr) return null;
  const [y, m, d] = toEnglishDigits(dateStr).split("/").map(Number);
  if (!y || !m || !d || !jalaali.isValidJalaaliDate(y, m, d)) return null;
  const isLeap = jalaali.isLeapJalaaliYear(y);
  let dayOfYear = d;
  for (let month = 1; month < m; month += 1) {
    dayOfYear += jalaali.jalaaliMonthLength(y, month);
  }
  return {
    isLeap,
    yearLength: isLeap ? 366 : 365,
    dayOfYear,
    year: y,
  };
}

export const STATUS_LABEL: Record<string, string> = {
  PRESENT: "حاضر",
  ABSENT: "غایب",
  DELAY: "تأخیر",
  RUSH: "تعجیل",
};

export const JUST_LABEL: Record<string, string> = {
  SICKNESS: "استعلاجی",
  PARENT_REQUEST: "هماهنگی والدین",
  MANAGER_REQUEST: "درخواست مدیریت / مأموریت",
  OTHER: "سایر",
};

export const EXCEPTION_LABEL: Record<string, string> = {
  HOLIDAY: "تعطیل رسمی",
  CLOSURE: "تعطیلی اضطراری",
};

export function fullName(person?: { firstName?: string; lastName?: string } | null) {
  if (!person) return "-";
  return `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim() || "-";
}
