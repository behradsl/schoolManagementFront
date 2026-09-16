"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getStoredUser } from "@/lib/api";
import { PageHeader } from "@/components/ui";

type Stats = {
  students: number;
  teachers: number;
  classes: number;
  todayAbsences: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [role, setRole] = useState<"ADMIN" | "TEACHER" | null>(null);

  useEffect(() => {
    setRole(getStoredUser()?.role ?? null);
    api<Stats>("/reports/dashboard").then(setStats).catch(() => undefined);
  }, []);

  const cards = [
    { label: "دانش‌آموزان", value: stats?.students ?? "—", href: "/students" },
    { label: "دبیران", value: stats?.teachers ?? "—", href: "/teachers" },
    { label: "کلاس‌ها", value: stats?.classes ?? "—", href: "/classes" },
    { label: "غیبت امروز", value: stats?.todayAbsences ?? "—", href: "/reports" },
  ];

  return (
    <div>
      <PageHeader
        title="داشبورد"
        subtitle={
          role === "TEACHER"
            ? "مشاهده برنامه کلاس و ثبت حضور و غیاب"
            : "مدیریت جامع اطلاعات آموزشی و حضور و غیاب"
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards
          .filter((card) => role === "ADMIN" || card.label === "غیبت امروز")
          .map((card) => (
            <Link key={card.label} href={card.href} className="official-card rounded-xl p-5">
              <div className="text-sm text-muted">{card.label}</div>
              <div className="mt-3 text-3xl font-black text-navy">{card.value}</div>
            </Link>
          ))}
      </div>
      <div className="official-card mt-6 rounded-xl p-6">
        <h2 className="mb-2 font-bold text-navy">دسترسی سریع</h2>
        <p className="text-sm leading-7 text-muted">
          از بخش «برنامه و حضور» می‌توانید ساعات آموزشی روز را به تفکیک کلاس یا دبیر ببینید و با انتخاب هر جلسه، وضعیت حاضر، غایب، تأخیر یا تعجیل دانش‌آموزان را ثبت کنید.
        </p>
      </div>
    </div>
  );
}
