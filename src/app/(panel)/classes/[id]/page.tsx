"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, downloadFile, uploadFile } from "@/lib/api";
import { Alert, Button, FileButton, FormGrid, Loading, Modal, PageHeader, Select, useBusy } from "@/components/ui";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import { ResponsiveRecords } from "@/components/responsive-records";
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
  const [windowStudent, setWindowStudent] = useState<(Student & { enrollmentStart?: string | null; enrollmentEnd?: string | null }) | null>(null);
  const [enrollStart, setEnrollStart] = useState("");
  const [enrollEnd, setEnrollEnd] = useState("");
  const { error, success, run, setSuccess } = useBusy();

  async function load() {
    const detail = await api<ClassDetail>(`/classes/${params.id}`);
    setData(detail);
    setAllStudents(await api<Student[]>("/students"));
  }
  useEffect(() => { load().catch(() => undefined); }, [params.id]);

  if (!data) return <Loading label="در حال دریافت کلاس..." />;

  return (
    <div>
      <PageHeader
        title={`کلاس ${data.name}`}
        subtitle={`${data.fieldOfStudy} — ${data.level} — سال ${data.studyYear?.name ?? data.studyingYearName} (${data.studyYear?.startDate} تا ${data.studyYear?.endDate})`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/classes">بازگشت</Link>
            </Button>
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
      <div className="official-card mb-4 flex flex-col gap-2 rounded-md p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Select label="افزودن دانش‌آموز موجود" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">انتخاب کنید</option>
            {allStudents.map((s) => (
              <option key={s.id} value={s.id}>{fullName(s)} — {s.nationalCode}</option>
            ))}
          </Select>
        </div>
        <Button
          onClick={() => {
            if (!studentId) return;
            run(async () => {
              await api(`/classes/${data.id}/students`, { method: "POST", body: JSON.stringify({ studentId }) });
              setStudentId("");
              await load();
            }).catch(() => undefined);
          }}
        >
          افزودن به کلاس
        </Button>
      </div>
      <ResponsiveRecords
        rows={data.students}
        rowKey={(s) => s.id}
        empty="دانش‌آموزی در این کلاس ثبت نشده است."
        columns={[
          { id: "firstName", header: "نام", primary: true, cell: (s) => s.firstName },
          { id: "lastName", header: "نام خانوادگی", cell: (s) => s.lastName },
          { id: "nationalCode", header: "کد ملی", cell: (s) => s.nationalCode },
          { id: "studentNumber", header: "شماره دانش‌آموزی", cell: (s) => s.studentNumber || "-" },
          { id: "window", header: "بازه عضویت", cell: (s) => `${s.enrollmentStart} تا ${s.enrollmentEnd}` },
        ]}
        actions={(s) => (
          <>
            <Button variant="outline" onClick={() => {
              setWindowStudent(s);
              setEnrollStart(s.enrollmentStart ?? data.studyYear?.startDate ?? "");
              setEnrollEnd(s.enrollmentEnd ?? data.studyYear?.endDate ?? "");
            }}>ویرایش بازه</Button>
            <Button variant="danger" onClick={() => {
              if (!confirm("حذف عضویت این دانش‌آموز از کلاس؟")) return;
              run(async () => {
                await api(`/classes/${data.id}/students/${s.id}`, { method: "DELETE" });
                await load();
              }).catch(() => undefined);
            }}>حذف از کلاس</Button>
          </>
        )}
      />
      <Modal open={Boolean(windowStudent)} title="ویرایش بازه عضویت" onClose={() => setWindowStudent(null)}>
        <Alert message={error} inline className="md:col-span-2" />
        <FormGrid onSubmit={(e) => {
          e.preventDefault();
          if (!windowStudent) return;
          run(async () => {
            await api(`/classes/${data.id}/students`, {
              method: "POST",
              body: JSON.stringify({
                studentId: windowStudent.id,
                startDate: enrollStart,
                endDate: enrollEnd,
              }),
            });
            setWindowStudent(null);
            await load();
          }, "بازه عضویت ذخیره شد").catch(() => undefined);
        }}>
          <JalaliDatePicker label="تاریخ شروع" value={enrollStart} onChange={setEnrollStart} />
          <JalaliDatePicker label="تاریخ پایان" value={enrollEnd} onChange={setEnrollEnd} />
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setWindowStudent(null)}>انصراف</Button>
            <Button>ذخیره</Button>
          </div>
        </FormGrid>
      </Modal>
    </div>
  );
}
