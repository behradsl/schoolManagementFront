"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, downloadFile, uploadFile } from "@/lib/api";
import {
  Alert,
  Button,
  FileButton,
  FormGrid,
  Input,
  JalaliDatePicker,
  Modal,
  PageHeader,
  Textarea,
  useBusy,
} from "@/components/ui";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber?: string | null;
  phoneNumber?: string | null;
  nationalCode: string;
  birthDate?: string | null;
  fatherFirstName?: string | null;
  fatherLastName?: string | null;
  fatherPhoneNumber?: string | null;
  motherFirstName?: string | null;
  motherLastName?: string | null;
  motherPhoneNumber?: string | null;
  address?: string | null;
  guardianName?: string | null;
  guardianLastName?: string | null;
  guardianPhone?: string | null;
  guardianAddress?: string | null;
  guardianRelation?: string | null;
};

const empty: Omit<Student, "id"> = {
  firstName: "",
  lastName: "",
  studentNumber: "",
  phoneNumber: "",
  nationalCode: "",
  birthDate: "",
  fatherFirstName: "",
  fatherLastName: "",
  fatherPhoneNumber: "",
  motherFirstName: "",
  motherLastName: "",
  motherPhoneNumber: "",
  address: "",
  guardianName: "",
  guardianLastName: "",
  guardianPhone: "",
  guardianAddress: "",
  guardianRelation: "",
};

export default function StudentsPage() {
  const [rows, setRows] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(empty);
  const { busy, error, success, run, setSuccess } = useBusy();

  async function load() {
    const data = await api<Student[]>(`/students${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    setRows(data);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(row: Student) {
    setEditing(row);
    setForm({ ...empty, ...row });
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      if (editing) {
        await api(`/students/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      } else {
        await api("/students", { method: "POST", body: JSON.stringify(form) });
      }
      setOpen(false);
      await load();
    }, "اطلاعات ذخیره شد");
  }

  return (
    <div>
      <PageHeader
        title="دانش‌آموزان"
        subtitle="ثبت، ویرایش، ورود اکسل و خروجی اطلاعات دانش‌آموزان"
        actions={
          <>
            <Button variant="outline" onClick={() => downloadFile("/students/excel/template", "student-template.xlsx")}>
              دانلود قالب اکسل
            </Button>
            <Button variant="outline" onClick={() => downloadFile("/students/excel/export", "students.xlsx")}>
              خروجی اکسل
            </Button>
            <FileButton
              label="ورود از اکسل"
              onFile={async (file) => {
                const result = await run(() => uploadFile<{ created: number; updated: number }>("/students/excel/import", file), "");
                setSuccess(`ایجاد: ${result?.created ?? 0} | به‌روزرسانی: ${result?.updated ?? 0}`);
                await load();
              }}
            />
            <Button onClick={openCreate}>دانش‌آموز جدید</Button>
          </>
        }
      />
      <div className="mb-4 flex gap-2">
        <input
          className="w-full max-w-sm rounded-md border border-line px-3 py-2"
          placeholder="جستجو بر اساس نام، کد ملی یا شماره دانش‌آموزی"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="outline" onClick={() => load()}>جستجو</Button>
      </div>
      <Alert message={error} />
      <Alert message={success} type="success" />
      <div className="official-card table-wrap rounded-xl">
        <table className="data">
          <thead>
            <tr>
              <th>نام</th>
              <th>نام خانوادگی</th>
              <th>کد ملی</th>
              <th>شماره دانش‌آموزی</th>
              <th>تلفن</th>
              <th>نام پدر</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.firstName}</td>
                <td>{row.lastName}</td>
                <td>{row.nationalCode}</td>
                <td>{row.studentNumber || "-"}</td>
                <td>{row.phoneNumber || "-"}</td>
                <td>{row.fatherFirstName || "-"}</td>
                <td className="space-x-2 space-x-reverse">
                  <Button variant="ghost" onClick={() => openEdit(row)}>ویرایش</Button>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      if (!confirm("حذف این دانش‌آموز؟")) return;
                      await api(`/students/${row.id}`, { method: "DELETE" });
                      await load();
                    }}
                  >
                    حذف
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} title={editing ? "ویرایش دانش‌آموز" : "ثبت دانش‌آموز"} onClose={() => setOpen(false)}>
        <FormGrid onSubmit={save}>
          <Input label="نام" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <Input label="نام خانوادگی" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          <Input label="کد ملی" value={form.nationalCode} onChange={(e) => setForm({ ...form, nationalCode: e.target.value })} required />
          <Input label="شماره دانش‌آموزی" value={form.studentNumber ?? ""} onChange={(e) => setForm({ ...form, studentNumber: e.target.value })} />
          <Input label="شماره تماس" value={form.phoneNumber ?? ""} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          <JalaliDatePicker label="تاریخ تولد" value={form.birthDate ?? ""} onChange={(birthDate) => setForm({ ...form, birthDate })} />
          <Input label="نام پدر" value={form.fatherFirstName ?? ""} onChange={(e) => setForm({ ...form, fatherFirstName: e.target.value })} />
          <Input label="نام خانوادگی پدر" value={form.fatherLastName ?? ""} onChange={(e) => setForm({ ...form, fatherLastName: e.target.value })} />
          <Input label="شماره تماس پدر" value={form.fatherPhoneNumber ?? ""} onChange={(e) => setForm({ ...form, fatherPhoneNumber: e.target.value })} />
          <Input label="نام مادر" value={form.motherFirstName ?? ""} onChange={(e) => setForm({ ...form, motherFirstName: e.target.value })} />
          <Input label="نام خانوادگی مادر" value={form.motherLastName ?? ""} onChange={(e) => setForm({ ...form, motherLastName: e.target.value })} />
          <Input label="شماره تماس مادر" value={form.motherPhoneNumber ?? ""} onChange={(e) => setForm({ ...form, motherPhoneNumber: e.target.value })} />
          <Input label="نام کفیل" value={form.guardianName ?? ""} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
          <Input label="نام خانوادگی کفیل" value={form.guardianLastName ?? ""} onChange={(e) => setForm({ ...form, guardianLastName: e.target.value })} />
          <Input label="نسبت کفیل" value={form.guardianRelation ?? ""} onChange={(e) => setForm({ ...form, guardianRelation: e.target.value })} />
          <Input label="شماره تماس کفیل" value={form.guardianPhone ?? ""} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
          <div className="md:col-span-2">
            <Textarea label="آدرس محل زندگی" value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Textarea label="آدرس کفیل" value={form.guardianAddress ?? ""} onChange={(e) => setForm({ ...form, guardianAddress: e.target.value })} />
          </div>
          <div className="md:col-span-2 mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button disabled={busy}>{busy ? "در حال ذخیره..." : "ذخیره"}</Button>
          </div>
        </FormGrid>
      </Modal>
    </div>
  );
}
