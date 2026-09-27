"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getStoredUser } from "@/lib/api";
import { PageHeader, Select, Button, Loading } from "@/components/ui";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import { EXCEPTION_LABEL, fullName, todayJalali } from "@/lib/format";
import { setNavPending } from "@/lib/nav-progress";

type Session = {
  lessonId: string;
  date: string;
  courseName: string;
  class: { id: string; name: string };
  timeSlot: { name: string; startTime: string; endTime: string };
  teacher: { firstName: string; lastName: string };
};

type ScheduleResponse = {
  date: string;
  dateInfo: { isLeap: boolean; yearLength: number; dayOfYear: number; year: number };
  closed?: { title: string; type: "HOLIDAY" | "CLOSURE"; startDate: string; endDate: string; note?: string | null } | null;
  sessions: Session[];
};

export default function SchedulePage() {
  const router = useRouter();
  const [role, setRole] = useState<"ADMIN" | "TEACHER" | null>(null);
  const [date, setDate] = useState("");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!date) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ date });
      if (classId) qs.set("classId", classId);
      if (teacherId && role === "ADMIN") qs.set("teacherId", teacherId);
      setData(await api<ScheduleResponse>(`/schedule?${qs.toString()}`));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = getStoredUser();
    setRole(stored?.role ?? null);
    setDate(todayJalali());
    if (stored?.role === "ADMIN") {
      api<Array<{ id: string; name: string }>>("/classes").then(setClasses).catch(() => undefined);
      api<Array<{ id: string; firstName: string; lastName: string }>>("/teachers").then(setTeachers).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!date) return;
    load().catch(() => undefined);
  }, [date, classId, teacherId, role]);

  return (
    <div>
      <PageHeader
        title="برنامه روزانه و حضور و غیاب"
        subtitle="برای هر جلسه دکمه «ثبت حضور و غیاب» را بزنید."
      />
      <div className="official-card mb-6 grid grid-cols-1 gap-3 rounded-md p-4 md:grid-cols-4">
        <JalaliDatePicker label="تاریخ" value={date} onChange={setDate} />
        {role === "ADMIN" && (
          <>
            <Select label="کلاس" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">همه کلاس‌ها</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="دبیر" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">همه دبیران</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{fullName(t)}</option>)}
            </Select>
          </>
        )}
        {data?.dateInfo && (
          <div className="flex items-end text-sm text-muted">
            روز {data.dateInfo.dayOfYear} از {data.dateInfo.yearLength} سال {data.dateInfo.year}
            {data.dateInfo.isLeap ? " (کبیسه)" : ""}
          </div>
        )}
      </div>
      {loading ? (
        <Loading label="در حال دریافت برنامه روز..." />
      ) : (
        <div className="grid gap-3">
          {data?.closed && (
            <div className="official-card rounded-md border-gold p-6 text-center">
              <div className="text-lg font-bold text-navy">مدرسه در این تاریخ تعطیل است</div>
              <p className="mt-2 text-sm text-muted">
                {EXCEPTION_LABEL[data.closed.type]}: {data.closed.title}
                {" "}از {data.closed.startDate} تا {data.closed.endDate}
                {data.closed.note ? ` — ${data.closed.note}` : ""}
              </p>
            </div>
          )}
          {!data?.closed && data?.sessions.length === 0 && (
            <div className="official-card rounded-md p-8 text-center text-muted">برای این تاریخ ساعت آموزشی ثبت نشده است.</div>
          )}
          {data?.sessions.map((session) => (
            <article key={session.lessonId} className="official-card flex flex-col gap-4 rounded-md p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-bold text-navy">{session.courseName}</div>
                <div className="text-sm text-muted">
                  {session.class.name} · {session.timeSlot.name} · {fullName(session.teacher)}
                </div>
                <div className="mt-1 text-sm text-navy">
                  {session.timeSlot.startTime} تا {session.timeSlot.endTime}
                </div>
              </div>
              <Button
                variant="gold"
                className="w-full shrink-0 sm:w-auto"
                onClick={() => {
                  setNavPending(true);
                  router.push(`/attendance?lessonId=${session.lessonId}&date=${session.date}`);
                }}
              >
                ثبت حضور و غیاب
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
