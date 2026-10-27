"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Alert, Button, Loading, PageHeader, Select, useBusy } from "@/components/ui";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import { fullName } from "@/lib/format";

type Teacher = { id: string; firstName: string; lastName: string };
type TimeSlot = { id: string; name: string; order: number; cycleDay: number; startTime: string; endTime: string };
type LessonWindow = {
  id: string;
  cycleDay: number;
  timeSlotId: string;
  courseName: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  attendanceCount?: number;
};
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
  lessons: LessonWindow[];
};
type WindowRow = {
  key: string;
  id?: string;
  courseName: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  attendanceCount: number;
};

function rowsFromLessons(lessons: LessonWindow[]) {
  const next: Record<string, WindowRow[]> = {};
  for (const lesson of lessons) {
    const key = `${lesson.cycleDay}:${lesson.timeSlotId}`;
    next[key] ??= [];
    next[key].push({
      key: lesson.id,
      id: lesson.id,
      courseName: lesson.courseName,
      teacherId: lesson.teacherId,
      startDate: lesson.startDate,
      endDate: lesson.endDate,
      attendanceCount: lesson.attendanceCount ?? 0,
    });
  }
  return next;
}

export default function ClassCyclePage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ClassCycle | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [grid, setGrid] = useState<Record<string, WindowRow[]>>({});
  const { busy, error, success, run } = useBusy();

  useEffect(() => {
    Promise.all([
      api<ClassCycle>(`/class-cycles/${params.id}`),
      api<Teacher[]>("/teachers"),
    ]).then(([detail, teacherRows]) => {
      setData(detail);
      setTeachers(teacherRows);
      setGrid(rowsFromLessons(detail.lessons));
    }).catch(() => undefined);
  }, [params.id]);

  const days = useMemo(() => data ? Array.from({ length: data.cycle.dayCount }, (_, i) => i + 1) : [], [data]);

  function updateRow(slotKey: string, rowKey: string, patch: Partial<WindowRow>) {
    setGrid((current) => ({
      ...current,
      [slotKey]: (current[slotKey] ?? []).map((row) => row.key === rowKey ? { ...row, ...patch } : row),
    }));
  }

  function addWindow(slotKey: string) {
    if (!data) return;
    setGrid((current) => ({
      ...current,
      [slotKey]: [
        ...(current[slotKey] ?? []),
        {
          key: crypto.randomUUID(),
          courseName: "",
          teacherId: "",
          startDate: data.startDate,
          endDate: data.endDate,
          attendanceCount: 0,
        },
      ],
    }));
  }

  function removeWindow(slotKey: string, rowKey: string) {
    setGrid((current) => ({
      ...current,
      [slotKey]: (current[slotKey] ?? []).filter((row) => row.key !== rowKey),
    }));
  }

  async function save() {
    if (!data) return;
    const saved = await run(async () => {
      const lessons = Object.entries(grid).flatMap(([key, rows]) => {
        const [cycleDay, timeSlotId] = key.split(":");
        return rows.flatMap((row) => {
          const touched = row.id || row.courseName.trim() || row.teacherId;
          if (!touched) return [];
          if (!row.courseName.trim() || !row.teacherId || !row.startDate || !row.endDate) {
            throw new Error("برای هر بازه، نام درس، دبیر، تاریخ شروع و تاریخ پایان لازم است");
          }
          return [{
            id: row.id,
            cycleDay: Number(cycleDay),
            timeSlotId,
            courseName: row.courseName.trim(),
            teacherId: row.teacherId,
            startDate: row.startDate,
            endDate: row.endDate,
          }];
        });
      });
      return api<ClassCycle>(`/class-cycles/${data.id}/lessons`, {
        method: "PUT",
        body: JSON.stringify({ lessons }),
      });
    }, "برنامه دروس ذخیره شد");
    if (saved) {
      setData(saved);
      setGrid(rowsFromLessons(saved.lessons));
    }
  }

  if (!data) return <Loading label="در حال دریافت برنامه کلاس..." />;

  return (
    <div>
      <PageHeader
        title={`دروس ${data.class.name}`}
        subtitle={`${data.cycle.name} از ${data.startDate} تا ${data.endDate}. هر جلسه می‌تواند چند بازه داشته باشد؛ مثلاً ورزش با یک دبیر تا یک تاریخ، و بعد تاریخ با دبیر دیگر تا پایان سیکل.`}
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
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {daySlots.map((slot) => {
                    const slotKey = `${day}:${slot.id}`;
                    const rows = grid[slotKey] ?? [];
                    return (
                      <div key={slot.id} className="lesson-cell rounded-md border border-line bg-cream/50 p-3">
                        <div>
                          <div className="text-sm font-bold text-navy">{slot.name}</div>
                          <div className="text-xs text-muted">{slot.startTime} تا {slot.endTime}</div>
                        </div>
                        {rows.map((row, index) => {
                          const locked = row.attendanceCount > 0;
                          return (
                            <div key={row.key} className="space-y-2 rounded-md border border-line bg-paper p-3">
                              <div className="text-xs font-bold text-navy">بازه {index + 1}</div>
                              <input
                                className="rounded border border-line px-2 py-1.5 disabled:bg-slate"
                                placeholder="نام درس"
                                value={row.courseName}
                                disabled={locked}
                                onChange={(e) => updateRow(slotKey, row.key, { courseName: e.target.value })}
                              />
                              <Select
                                label="دبیر"
                                value={row.teacherId}
                                disabled={locked}
                                onChange={(e) => updateRow(slotKey, row.key, { teacherId: e.target.value })}
                              >
                                <option value="">بدون دبیر</option>
                                {teachers.map((teacher) => (
                                  <option key={teacher.id} value={teacher.id}>{fullName(teacher)}</option>
                                ))}
                              </Select>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <JalaliDatePicker
                                  label="از تاریخ"
                                  value={row.startDate}
                                  onChange={(startDate) => updateRow(slotKey, row.key, { startDate })}
                                />
                                <JalaliDatePicker
                                  label="تا تاریخ"
                                  value={row.endDate}
                                  onChange={(endDate) => updateRow(slotKey, row.key, { endDate })}
                                />
                              </div>
                              {locked ? (
                                <p className="text-xs text-muted">برای این بازه حضور و غیاب ثبت شده است. نام درس و دبیر ثابت می‌ماند و تاریخ باید روزهای ثبت‌شده را بپوشاند.</p>
                              ) : (
                                <button
                                  type="button"
                                  className="text-xs text-red-700"
                                  onClick={() => removeWindow(slotKey, row.key)}
                                >
                                  حذف بازه
                                </button>
                              )}
                            </div>
                          );
                        })}
                        <Button type="button" variant="outline" onClick={() => addWindow(slotKey)}>
                          {rows.length ? "افزودن بازه" : "افزودن درس"}
                        </Button>
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
