"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Alert, Button, FormGrid, Input, Modal, PageHeader, useBusy } from "@/components/ui";

type SchoolClass = {
  id: string;
  name: string;
  fieldOfStudy: string;
  level: string;
  studyingYearName: string;
  _count?: { students: number };
};

const empty = { name: "", fieldOfStudy: "", level: "", studyingYearName: "" };

export default function ClassesPage() {
  const [rows, setRows] = useState<SchoolClass[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [form, setForm] = useState(empty);
  const { busy, error, run } = useBusy();

  async function load() {
    setRows(await api<SchoolClass[]>("/classes"));
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
        subtitle="نام کلاس، رشته، مقطع و سال تحصیلی"
        actions={<Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}>کلاس جدید</Button>}
      />
      <Alert message={error} />
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
                <td>{row.studyingYearName}</td>
                <td>{row._count?.students ?? 0}</td>
                <td className="space-x-2 space-x-reverse">
                  <Link className="text-navy underline" href={`/classes/${row.id}`}>فهرست دانش‌آموزان</Link>
                  <Button variant="ghost" onClick={() => { setEditing(row); setForm(row); setOpen(true); }}>ویرایش</Button>
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
          <Input label="سال تحصیلی" value={form.studyingYearName} onChange={(e) => setForm({ ...form, studyingYearName: e.target.value })} required />
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button disabled={busy}>ذخیره</Button>
          </div>
        </FormGrid>
      </Modal>
    </div>
  );
}
