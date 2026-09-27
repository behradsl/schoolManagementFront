"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Alert, Button, Loading, PageHeader, useBusy } from "@/components/ui";
import { fullName } from "@/lib/format";

type Teacher = { id: string; firstName: string; lastName: string };
type TimeSlot = { id: string; name: string; order: number; cycleDay: number; startTime: string; endTime: string };
type ClassCycle = {
  id: string;
  startDate: string;
  endDate: string;
  startCycleDay: number;
  class: { name: string };
  cycle: {
    name: string;
    dayCount: number;
    timeSlots: TimeSlot[];
  };
  lessons: Array<{ cycleDay: number; timeSlotId: string; courseName: string; teacherId: string }>;
};

export default function ClassCyclePage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ClassCycle | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [grid, setGrid] = useState<Record<string, { courseName: string; teacherId: string }>>({});
  const { busy, error, success, run } = useBusy();

  useEffect(() => {
    Promise.all([
      api<ClassCycle>(`/class-cycles/${params.id}`),
      api<Teacher[]>("/teachers"),
    ]).then(([detail, teacherRows]) => {
      setData(detail);
      setTeachers(teacherRows);
      const next: Record<string, { courseName: string; teacherId: string }> = {};
      for (const lesson of detail.lessons) {
        next[`${lesson.cycleDay}:${lesson.timeSlotId}`] = {
          courseName: lesson.courseName,
          teacherId: lesson.teacherId,
        };
      }
      setGrid(next);
    }).catch(() => undefined);
  }, [params.id]);

  const days = useMemo(() => data ? Array.from({ length: data.cycle.dayCount }, (_, i) => i + 1) : [], [data]);

  async function save() {
    if (!data) return;
    const lessons = Object.entries(grid)
      .filter(([, v]) => v.courseName && v.teacherId)
      .map(([key, v]) => {
        const [cycleDay, timeSlotId] = key.split(":");
        return { cycleDay: Number(cycleDay), timeSlotId, courseName: v.courseName, teacherId: v.teacherId };
      });
    await run(() => api(`/class-cycles/${data.id}/lessons`, {
      method: "PUT",
      body: JSON.stringify({ lessons }),
    }), "برنامه دروس ذخیره شد");
  }

  if (!data) return <Loading label="در حال دریافت برنامه کلاس..." />;

  return (
    <div>
      <PageHeader
        title={`دروس ${data.class.name}`}
        subtitle={`${data.cycle.name} از ${data.startDate} تا ${data.endDate}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/cycles">بازگشت</Link>
            </Button>
            <Button onClick={save} disabled={busy}>ذخیره برنامه</Button>
          </>
        }
      />
      <Alert message={error} />
      <Alert message={success} type="success" />
      <div className="space-y-4">
        {days.map((day) => {
          const daySlots = data.cycle.timeSlots.filter((slot) => slot.cycleDay === day);
          return (
            <section key={day} className="official-card rounded-md p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-bold text-navy">روز {day} سیکل</h3>
                {daySlots.length === 0 && (
                  <span className="rounded-md bg-slate px-3 py-1 text-xs text-muted">بدون ساعت آموزشی</span>
                )}
              </div>
              {daySlots.length === 0 ? (
                <p className="text-sm text-muted">برای این روز سیکل ساعتی تعریف نشده و درسی برگزار نمی‌شود.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {daySlots.map((slot) => {
                    const key = `${day}:${slot.id}`;
                    const cell = grid[key] || { courseName: "", teacherId: "" };
                    return (
                      <div key={slot.id} className="lesson-cell rounded-md border border-line bg-cream/50 p-3">
                        <div className="text-sm font-bold text-navy">{slot.name}</div>
                        <div className="text-xs text-muted">{slot.startTime} تا {slot.endTime}</div>
                        <input
                          className="rounded border border-line px-2 py-1.5"
                          placeholder="نام درس"
                          value={cell.courseName}
                          onChange={(e) => setGrid({ ...grid, [key]: { ...cell, courseName: e.target.value } })}
                        />
                        <select
                          className="rounded border border-line px-2 py-1.5"
                          value={cell.teacherId}
                          onChange={(e) => setGrid({ ...grid, [key]: { ...cell, teacherId: e.target.value } })}
                        >
                          <option value="">دبیر</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>{fullName(t)}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
