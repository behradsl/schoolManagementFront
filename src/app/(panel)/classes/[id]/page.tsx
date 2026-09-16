"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, downloadFile, uploadFile } from "@/lib/api";
import { Alert, Button, FileButton, PageHeader, Select, useBusy } from "@/components/ui";
import { fullName } from "@/lib/format";

type Student = { id: string; firstName: string; lastName: string; nationalCode: string; studentNumber?: string | null };
type ClassDetail = {
  id: string;
  name: string;
  fieldOfStudy: string;
  level: string;
  studyingYearName?: string;
  studyYear?: { name: string; startDate: string; endDate: string };
  students: Array<Student & { enrollmentStart?: string | null; enrollmentEnd?: string | null }>;
};

export default function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ClassDetail | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const { error, success, run, setSuccess } = useBusy();

  async function load() {
    const detail = await api<ClassDetail>(`/classes/${params.id}`);
    setData(detail);
    setAllStudents(await api<Student[]>("/students"));
  }
  useEffect(() => { load().catch(() => undefined); }, [params.id]);

  if (!data) return <div>در حال بارگذاری...</div>;

  return (
    <div>
      <PageHeader
        title={`کلاس ${data.name}`}
        subtitle={`${data.fieldOfStudy} — ${data.level} — سال ${data.studyYear?.name ?? data.studyingYearName} (${data.studyYear?.startDate} تا ${data.studyYear?.endDate})`}
        actions={
          <>
            <Link href="/classes"><Button variant="outline">بازگشت</Button></Link>
            <Button variant="outline" onClick={() => downloadFile(`/classes/${data.id}/students/excel/template`, "class-students-template.xlsx")}>
              قالب اکسل دانش‌آموزان کلاس
            </Button>
            <FileButton
              label="ورود اکسل و به‌روزرسانی بر اساس کد ملی"
              onFile={async (file) => {
                const result = await run(() =>
                  uploadFile<{ created: number; updated: number; enrolled: number }>(`/classes/${data.id}/students/excel/import`, file),
                );
                setSuccess(`ایجاد: ${result?.created} | به‌روزرسانی: ${result?.updated} | عضویت کلاس: ${result?.enrolled}`);
                await load();
              }}
            />
          </>
        }
      />
      <Alert message={error} />
      <Alert message={success} type="success" />
      <div className="official-card mb-4 flex flex-col gap-2 rounded-xl p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Select label="افزودن دانش‌آموز موجود" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">انتخاب کنید</option>
            {allStudents.map((s) => (
              <option key={s.id} value={s.id}>{fullName(s)} — {s.nationalCode}</option>
            ))}
          </Select>
        </div>
        <Button
          onClick={async () => {
            if (!studentId) return;
            await api(`/classes/${data.id}/students`, { method: "POST", body: JSON.stringify({ studentId }) });
            setStudentId("");
            await load();
          }}
        >
          افزودن به کلاس
        </Button>
      </div>
      <div className="official-card table-wrap rounded-xl">
        <table className="data">
          <thead>
            <tr>
              <th>نام</th>
              <th>نام خانوادگی</th>
              <th>کد ملی</th>
              <th>شماره دانش‌آموزی</th>
              <th>بازه عضویت</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((s) => (
              <tr key={s.id}>
                <td>{s.firstName}</td>
                <td>{s.lastName}</td>
                <td>{s.nationalCode}</td>
                <td>{s.studentNumber || "-"}</td>
                <td>{s.enrollmentStart} تا {s.enrollmentEnd}</td>
                <td>
                  <Button variant="danger" onClick={async () => {
                    await api(`/classes/${data.id}/students/${s.id}`, { method: "DELETE" });
                    await load();
                  }}>حذف از کلاس</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
