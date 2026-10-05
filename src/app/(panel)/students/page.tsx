"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, downloadFile, uploadFile } from "@/lib/api";
import {
  Alert,
  Button,
  FileButton,
  FormGrid,
  Input,
  Loading,
  Modal,
  PageHeader,
  Textarea,
  useBusy,
} from "@/components/ui";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import { ResponsiveRecords } from "@/components/responsive-records";

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
  const { busy, error, success, run, setSuccess, loading, loadData } = useBusy(true);

  async function load() {
    await loadData(async () => {
      const data = await api<Student[]>(`/students${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      setRows(data);
    }).catch(() => undefined);
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

  function studentPayload() {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = form as typeof form & {
      id?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    return payload;
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const payload = studentPayload();
      if (editing) {
        await api(`/students/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await api("/students", { method: "POST", body: JSON.stringify(payload) });
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
        <div className="w-full max-w-sm">
          <Input
            placeholder="جستجو بر اساس نام، کد ملی یا شماره دانش‌آموزی"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="جستجوی دانش‌آموز"
          />
        </div>
        <Button variant="outline" onClick={() => load()}>جستجو</Button>
      </div>
      <Alert message={error} />
      <Alert message={success} type="success" />
      {loading ? (
        <Loading label="در حال دریافت دانش‌آموزان..." />
      ) : (
      <ResponsiveRecords
        rows={rows}
        rowKey={(row) => row.id}
        columns={[
          { id: "firstName", header: "نام", primary: true, cell: (row) => row.firstName },
          { id: "lastName", header: "نام خانوادگی", cell: (row) => row.lastName },
          { id: "nationalCode", header: "کد ملی", cell: (row) => row.nationalCode },
          { id: "studentNumber", header: "شماره دانش‌آموزی", cell: (row) => row.studentNumber || "-" },
          { id: "phoneNumber", header: "تلفن", cell: (row) => row.phoneNumber || "-" },
          { id: "father", header: "نام پدر", cell: (row) => row.fatherFirstName || "-" },
        ]}
        actions={(row) => (
          <>
            <Button variant="outline" onClick={() => openEdit(row)}>ویرایش</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!confirm("حذف این دانش‌آموز؟")) return;
                run(async () => {
                  await api(`/students/${row.id}`, { method: "DELETE" });
                  await load();
                }).catch(() => undefined);
              }}
            >
              حذف
            </Button>
          </>
        )}
      />
      )}
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
