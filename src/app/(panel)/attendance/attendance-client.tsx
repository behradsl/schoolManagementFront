"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Alert, Button, Modal, PageHeader, Select, Textarea, useBusy } from "@/components/ui";
import { JUST_LABEL, STATUS_LABEL, fullName } from "@/lib/format";

type Status = "PRESENT" | "ABSENT" | "DELAY" | "RUSH";
type Row = {
  student: { id: string; firstName: string; lastName: string; nationalCode: string };
  attendance: {
    id: string;
    status: Status;
    justification?: { type: string; note?: string | null } | null;
  } | null;
};
type Session = {
  lesson: { courseName: string; class: { name: string }; timeSlot: { name: string; startTime: string; endTime: string }; teacher: { firstName: string; lastName: string } };
  date: string;
  students: Row[];
};

const STATUSES: Status[] = ["PRESENT", "ABSENT", "DELAY", "RUSH"];

export default function AttendanceClient() {
  const search = useSearchParams();
  const router = useRouter();
  const lessonId = search.get("lessonId") || "";
  const date = search.get("date") || "";
  const [session, setSession] = useState<Session | null>(null);
  const [records, setRecords] = useState<Record<string, { status: Status; justificationType?: string; justificationNote?: string }>>({});
  const [justFor, setJustFor] = useState<string | null>(null);
  const [notifySms, setNotifySms] = useState(false);
  const { busy, error, success, run } = useBusy();

  useEffect(() => {
    if (!lessonId || !date) return;
    api<Session>(`/attendance/session?lessonId=${lessonId}&date=${date}`).then((data) => {
      setSession(data);
      const next: typeof records = {};
      for (const row of data.students) {
        next[row.student.id] = {
          status: row.attendance?.status || "PRESENT",
          justificationType: row.attendance?.justification?.type,
          justificationNote: row.attendance?.justification?.note || "",
        };
      }
      setRecords(next);
    }).catch(() => undefined);
  }, [lessonId, date]);

  const counts = useMemo(() => {
    const values = Object.values(records);
    return {
      present: values.filter((v) => v.status === "PRESENT").length,
      absent: values.filter((v) => v.status === "ABSENT").length,
    };
  }, [records]);

  async function save() {
    await run(() => api("/attendance/bulk", {
      method: "PUT",
      body: JSON.stringify({
        lessonId,
        date,
        notifySms,
        records: Object.entries(records).map(([studentId, value]) => ({
          studentId,
          status: value.status,
          justificationType: value.status === "PRESENT" ? undefined : value.justificationType,
          justificationNote: value.justificationNote,
        })),
      }),
    }), "حضور و غیاب ذخیره شد");
  }

  if (!session) return <div>در حال بارگذاری...</div>;

  return (
    <div>
      <PageHeader
        title={`حضور و غیاب ${session.lesson.courseName}`}
        subtitle={`${session.lesson.class.name} · ${session.date} · ${session.lesson.timeSlot.name} (${session.lesson.timeSlot.startTime} تا ${session.lesson.timeSlot.endTime}) · ${fullName(session.lesson.teacher)}`}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/schedule")}>بازگشت به برنامه</Button>
            <Button onClick={save} disabled={busy}>ذخیره</Button>
          </>
        }
      />
      <Alert message={error} />
      <Alert message={success} type="success" />
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <span>حاضر: {counts.present}</span>
        <span>غایب: {counts.absent}</span>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} />
          اطلاع‌رسانی پیامکی غیبت غیرموجه به والدین
        </label>
      </div>
      <div className="official-card table-wrap rounded-xl">
        <table className="data">
          <thead>
            <tr>
              <th>دانش‌آموز</th>
              <th>کد ملی</th>
              <th>وضعیت</th>
              <th>توجیه</th>
            </tr>
          </thead>
          <tbody>
            {session.students.map((row) => {
              const rec = records[row.student.id];
              return (
                <tr key={row.student.id}>
                  <td>{fullName(row.student)}</td>
                  <td>{row.student.nationalCode}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          className={`rounded-full px-3 py-1 text-xs ${rec?.status === status ? "bg-navy text-white" : "bg-cream text-navy"}`}
                          onClick={() => setRecords({ ...records, [row.student.id]: { ...rec, status } })}
                        >
                          {STATUS_LABEL[status]}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td>
                    {rec?.status !== "PRESENT" ? (
                      <Button variant="outline" onClick={() => setJustFor(row.student.id)}>
                        {rec?.justificationType ? JUST_LABEL[rec.justificationType] : "ثبت توجیه"}
                      </Button>
                    ) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Modal open={!!justFor} title="توجیه غیبت / تأخیر / تعجیل" onClose={() => setJustFor(null)}>
        {justFor && (
          <div className="space-y-3">
            <Select
              label="نوع توجیه"
              value={records[justFor]?.justificationType || ""}
              onChange={(e) => setRecords({ ...records, [justFor]: { ...records[justFor], justificationType: e.target.value } })}
            >
              <option value="">بدون توجیه</option>
              {Object.entries(JUST_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
            <Textarea
              label="توضیحات"
              value={records[justFor]?.justificationNote || ""}
              onChange={(e) => setRecords({ ...records, [justFor]: { ...records[justFor], justificationNote: e.target.value } })}
            />
            <div className="flex justify-end">
              <Button onClick={() => setJustFor(null)}>تأیید</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
