"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Alert, Button, FormGrid, Input, Modal, PageHeader, Select, useBusy } from "@/components/ui";

type StudyYear = { id: string; name: string; startDate: string; endDate: string };
type SchoolClass = {
  id: string;
  name: string;
  fieldOfStudy: string;
  level: string;
  studyYearId: string;
  studyingYearName?: string;
  studyYear?: StudyYear;
  _count?: { students: number };
};

const empty = { name: "", fieldOfStudy: "", level: "", studyYearId: "" };

export default function ClassesPage() {
  const [rows, setRows] = useState<SchoolClass[]>([]);
  const [years, setYears] = useState<StudyYear[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [form, setForm] = useState(empty);
  const { busy, error, run } = useBusy();

  async function load() {
    const [classRows, yearRows] = await Promise.all([
      api<SchoolClass[]>("/classes"),
      api<StudyYear[]>("/study-years"),
    ]);
    setRows(classRows);
    setYears(yearRows);
  }
  useEffect(() => { load().catch(() => undefined); }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      if (editing) await api(`/classes/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      else await api("/classes", { method: "POST", body: JSON.stringify(form) });
      setOpen(false);
      await load();
    });
  }

  return (
    <div>
      <PageHeader
        title="کلاس‌ها"
        subtitle="هر کلاس متعلق به یک سال تحصیلی است؛ کلاس هم‌نام در دو سال جداگانه ثبت می‌شود."
        actions={<Button onClick={() => { setEditing(null); setForm({ ...empty, studyYearId: years[0]?.id ?? "" }); setOpen(true); }}>کلاس جدید</Button>}
      />
      <Alert message={error} />
      {years.length === 0 && (
        <Alert message="ابتدا از بخش مدرسه و سال تحصیلی، یک سال تحصیلی تعریف کنید." />
      )}
      <div className="official-card table-wrap rounded-xl">
        <table className="data">
          <thead>
            <tr>
              <th>نام کلاس</th>
              <th>رشته</th>
              <th>مقطع</th>
              <th>سال تحصیلی</th>
              <th>تعداد دانش‌آموز</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.fieldOfStudy}</td>
                <td>{row.level}</td>
                <td>{row.studyYear?.name ?? row.studyingYearName}</td>
                <td>{row._count?.students ?? 0}</td>
                <td className="space-x-2 space-x-reverse">
                  <Link className="text-navy underline" href={`/classes/${row.id}`}>فهرست دانش‌آموزان</Link>
                  <Button variant="ghost" onClick={() => {
                    setEditing(row);
                    setForm({
                      name: row.name,
                      fieldOfStudy: row.fieldOfStudy,
                      level: row.level,
                      studyYearId: row.studyYearId,
                    });
                    setOpen(true);
                  }}>ویرایش</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} title={editing ? "ویرایش کلاس" : "ثبت کلاس"} onClose={() => setOpen(false)}>
        <FormGrid onSubmit={save}>
          <Input label="نام کلاس" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="رشته" value={form.fieldOfStudy} onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })} required />
          <Input label="مقطع / سطح تحصیل" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} required />
          <Select label="سال تحصیلی" value={form.studyYearId} onChange={(e) => setForm({ ...form, studyYearId: e.target.value })} required>
            <option value="">انتخاب سال تحصیلی</option>
            {years.map((year) => (
              <option key={year.id} value={year.id}>{year.name} ({year.startDate} تا {year.endDate})</option>
            ))}
          </Select>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button disabled={busy || !form.studyYearId}>ذخیره</Button>
          </div>
        </FormGrid>
      </Modal>
    </div>
  );
}
