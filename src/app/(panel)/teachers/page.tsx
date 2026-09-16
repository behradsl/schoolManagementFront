"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, downloadFile, uploadFile } from "@/lib/api";
import { Alert, Button, FileButton, FormGrid, Input, Modal, PageHeader, useBusy } from "@/components/ui";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  personnelNumber: string;
  teachingField?: string | null;
};

const empty = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  personnelNumber: "",
  teachingField: "",
};

export default function TeachersPage() {
  const [rows, setRows] = useState<Teacher[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState(empty);
  const { busy, error, success, run, setSuccess } = useBusy();

  async function load() {
    setRows(await api<Teacher[]>("/teachers"));
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      if (editing) await api(`/teachers/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      else await api("/teachers", { method: "POST", body: JSON.stringify(form) });
      setOpen(false);
      await load();
    }, "اطلاعات دبیر ذخیره شد");
  }

  return (
    <div>
      <PageHeader
        title="دبیران"
        subtitle="مدیریت اطلاعات پرسنل آموزشی و ورود گروهی از اکسل"
        actions={
          <>
            <Button variant="outline" onClick={() => downloadFile("/teachers/excel/template", "teacher-template.xlsx")}>
              دانلود قالب
            </Button>
            <Button variant="outline" onClick={() => downloadFile("/teachers/excel/export", "teachers.xlsx")}>
              خروجی اکسل
            </Button>
            <FileButton
              label="ورود از اکسل"
              onFile={async (file) => {
                const result = await run(() => uploadFile<{ created: number; updated: number }>("/teachers/excel/import", file));
                setSuccess(`ایجاد: ${result?.created ?? 0} | به‌روزرسانی: ${result?.updated ?? 0}`);
                await load();
              }}
            />
            <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}>دبیر جدید</Button>
          </>
        }
      />
      <Alert message={error} />
      <Alert message={success} type="success" />
      <div className="official-card table-wrap rounded-xl">
        <table className="data">
          <thead>
            <tr>
              <th>نام</th>
              <th>نام خانوادگی</th>
              <th>کد پرسنلی</th>
              <th>تلفن</th>
              <th>رشته تدریس</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.firstName}</td>
                <td>{row.lastName}</td>
                <td>{row.personnelNumber}</td>
                <td>{row.phoneNumber || "-"}</td>
                <td>{row.teachingField || "-"}</td>
                <td>
                  <Button variant="ghost" onClick={() => { setEditing(row); setForm({ ...empty, ...row }); setOpen(true); }}>ویرایش</Button>
                  <Button variant="danger" onClick={async () => {
                    if (!confirm("حذف این دبیر؟")) return;
                    await api(`/teachers/${row.id}`, { method: "DELETE" });
                    await load();
                  }}>حذف</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} title={editing ? "ویرایش دبیر" : "ثبت دبیر"} onClose={() => setOpen(false)}>
        <FormGrid onSubmit={save}>
          <Input label="نام" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <Input label="نام خانوادگی" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          <Input label="کد پرسنلی" value={form.personnelNumber} onChange={(e) => setForm({ ...form, personnelNumber: e.target.value })} required />
          <Input label="شماره تماس" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          <Input label="رشته تدریس" value={form.teachingField} onChange={(e) => setForm({ ...form, teachingField: e.target.value })} />
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button disabled={busy}>ذخیره</Button>
          </div>
        </FormGrid>
      </Modal>
    </div>
  );
}
