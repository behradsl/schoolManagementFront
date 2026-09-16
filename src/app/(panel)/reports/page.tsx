"use client";

import { useEffect, useState } from "react";
import { api, downloadFile, getStoredUser } from "@/lib/api";
import { Alert, Button, Input, JalaliDatePicker, PageHeader, Select, useBusy } from "@/components/ui";
import { fullName } from "@/lib/format";

type ReportMode = "all" | "absent";

type Report = {
  summary: { total: number; present: number; absent: number; delay: number; rush: number; justified: number };
  rows: Array<{
    id: string;
    date: string;
    statusLabel: string;
    courseName: string;
    student: { firstName: string; lastName: string; nationalCode: string };
    class: { name: string };
    teacher: { firstName: string; lastName: string };
    timeSlot: { name: string; startTime: string; endTime: string };
    justification?: { typeLabel: string } | null;
  }>;
};

type ReportOptions = {
  students: Array<{ id: string; firstName: string; lastName: string; nationalCode: string }>;
  timeSlots: Array<{ name: string; startTime: string; endTime: string }>;
};

export default function ReportsPage() {
  const [role, setRole] = useState<"ADMIN" | "TEACHER" | null>(null);
  const [mode, setMode] = useState<ReportMode>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [timeSlotName, setTimeSlotName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [options, setOptions] = useState<ReportOptions>({ students: [], timeSlots: [] });
  const [data, setData] = useState<Report | null>(null);
  const { error, run } = useBusy();

  useEffect(() => {
    const stored = getStoredUser();
    setRole(stored?.role ?? null);
    api<Array<{ id: string; name: string }>>("/classes").then(setClasses).catch(() => undefined);
    api<ReportOptions>("/reports/options").then(setOptions).catch(() => undefined);
    if (stored?.role === "ADMIN") {
      api<Array<{ id: string; firstName: string; lastName: string }>>("/teachers").then(setTeachers).catch(() => undefined);
    }
  }, []);

  function query() {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    if (classId) qs.set("classId", classId);
    if (teacherId) qs.set("teacherId", teacherId);
    if (studentId) qs.set("studentId", studentId);
    if (timeSlotName) qs.set("timeSlotName", timeSlotName);
    if (courseName) qs.set("courseName", courseName);
    if (mode === "absent") qs.set("status", "ABSENT");
    return qs.toString();
  }

  async function load() {
    await run(async () => {
      setData(await api<Report>(`/reports/attendance?${query()}`));
    });
  }

  useEffect(() => { load().catch(() => undefined); }, [mode]);

  const filePrefix = mode === "absent" ? "absence-report" : "attendance-report";

  return (
    <div>
      <PageHeader
        title={mode === "absent" ? "گزارش غیبت دانش‌آموزان" : "گزارش حضور و غیاب"}
        subtitle="بر اساس بازه تاریخ، ساعت آموزشی، کلاس، دبیر و دانش‌آموز — خروجی PDF و اکسل"
        actions={
          <>
            <Button variant="outline" onClick={() => downloadFile(`/reports/attendance/excel?${query()}`, `${filePrefix}.xlsx`)}>خروجی اکسل</Button>
            <Button onClick={() => downloadFile(`/reports/attendance/pdf?${query()}`, `${filePrefix}.pdf`)}>خروجی PDF</Button>
          </>
        }
      />
      <Alert message={error} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={mode === "all" ? "primary" : "outline"} onClick={() => { setMode("all"); }}>همه وضعیت‌ها</Button>
        <Button variant={mode === "absent" ? "primary" : "outline"} onClick={() => { setMode("absent"); }}>فقط غیبت</Button>
      </div>
      <div className="official-card mb-6 grid grid-cols-1 gap-3 rounded-xl p-4 md:grid-cols-3">
        <JalaliDatePicker label="از تاریخ" value={from} onChange={setFrom} />
        <JalaliDatePicker label="تا تاریخ" value={to} onChange={setTo} />
        <Select label="ساعت آموزشی" value={timeSlotName} onChange={(e) => setTimeSlotName(e.target.value)}>
          <option value="">همه ساعت‌ها</option>
          {options.timeSlots.map((slot) => (
            <option key={`${slot.name}-${slot.startTime}`} value={slot.name}>
              {slot.name} ({slot.startTime} تا {slot.endTime})
            </option>
          ))}
        </Select>
        <Select label="کلاس" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">همه</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label="دانش‌آموز" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          <option value="">همه دانش‌آموزان</option>
          {options.students.map((s) => (
            <option key={s.id} value={s.id}>{fullName(s)} — {s.nationalCode}</option>
          ))}
        </Select>
        {role === "ADMIN" && (
          <Select label="دبیر" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">همه</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{fullName(t)}</option>)}
          </Select>
        )}
        <Input label="نام درس" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
        <div className="flex items-end"><Button onClick={load}>اعمال فیلتر</Button></div>
      </div>
      {data && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {(mode === "absent"
            ? [
                ["غایب", data.summary.absent],
                ["موجه", data.summary.justified],
                ["غیرموجه", data.summary.absent - data.summary.justified],
              ]
            : [
                ["کل", data.summary.total],
                ["حاضر", data.summary.present],
                ["غایب", data.summary.absent],
                ["تأخیر", data.summary.delay],
                ["تعجیل", data.summary.rush],
              ]
          ).map(([label, value]) => (
            <div key={String(label)} className="official-card rounded-lg p-3">
              <div className="text-xs text-muted">{label}</div>
              <div className="text-xl font-bold text-navy">{value}</div>
            </div>
          ))}
        </div>
      )}
      <div className="official-card table-wrap rounded-xl">
        <table className="data">
          <thead>
            <tr>
              <th>تاریخ</th>
              <th>دانش‌آموز</th>
              <th>کلاس</th>
              <th>درس</th>
              <th>دبیر</th>
              <th>ساعت</th>
              <th>وضعیت</th>
              <th>توجیه</th>
            </tr>
          </thead>
          <tbody>
            {data?.rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted">برای این بازه و ساعت آموزشی رکوردی یافت نشد.</td>
              </tr>
            )}
            {data?.rows.map((row) => (
              <tr key={row.id}>
                <td>{row.date}</td>
                <td>{fullName(row.student)}</td>
                <td>{row.class.name}</td>
                <td>{row.courseName}</td>
                <td>{fullName(row.teacher)}</td>
                <td>{row.timeSlot.name} ({row.timeSlot.startTime} تا {row.timeSlot.endTime})</td>
                <td>{row.statusLabel}</td>
                <td>{row.justification?.typeLabel || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
