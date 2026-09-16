"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Alert, Button, PageHeader, useBusy } from "@/components/ui";
import { fullName } from "@/lib/format";

type Teacher = { id: string; firstName: string; lastName: string };
type ClassCycle = {
  id: string;
  startDate: string;
  endDate: string;
  startCycleDay: number;
  class: { name: string };
  cycle: {
    name: string;
    dayCount: number;
    timeSlots: Array<{ id: string; name: string; order: number; startTime: string; endTime: string }>;
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

  if (!data) return <div>در حال بارگذاری...</div>;

  return (
    <div>
      <PageHeader
        title={`دروس ${data.class.name}`}
        subtitle={`${data.cycle.name} از ${data.startDate} تا ${data.endDate}`}
        actions={
          <>
            <Link href="/cycles"><Button variant="outline">بازگشت</Button></Link>
            <Button onClick={save} disabled={busy}>ذخیره برنامه</Button>
          </>
        }
      />
      <Alert message={error} />
      <Alert message={success} type="success" />
      <div className="official-card table-wrap rounded-xl p-3">
        <table className="data lesson-grid">
          <thead>
            <tr>
              <th className="day-label">روز سیکل</th>
              {data.cycle.timeSlots.map((slot) => (
                <th key={slot.id}>
                  {slot.name}
                  <div className="text-xs font-normal text-muted">
                    {slot.startTime} تا {slot.endTime}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <td className="day-label font-bold">روز {day}</td>
                {data.cycle.timeSlots.map((slot) => {
                  const key = `${day}:${slot.id}`;
                  const cell = grid[key] || { courseName: "", teacherId: "" };
                  return (
                    <td key={slot.id}>
                      <div className="lesson-cell">
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
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
