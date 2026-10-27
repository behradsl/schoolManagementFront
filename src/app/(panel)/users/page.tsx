"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Alert, Button, FormGrid, Input, Loading, Modal, PageHeader, PasswordInput, Select, useBusy } from "@/components/ui";
import { ResponsiveRecords } from "@/components/responsive-records";
import { fullName } from "@/lib/format";

type UserRow = {
  id: string;
  username: string;
  role: "ADMIN" | "TEACHER";
  teacherId?: string | null;
  teacher?: { firstName: string; lastName: string } | null;
};
type Teacher = { id: string; firstName: string; lastName: string };

const empty = { username: "", password: "", passwordConfirm: "", role: "TEACHER" as "ADMIN" | "TEACHER", teacherId: "" };

export default function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const { busy, error, run, loading, loadData } = useBusy(true);

  async function load() {
    await loadData(async () => {
      setRows(await api<UserRow[]>("/users"));
      setTeachers(await api<Teacher[]>("/teachers"));
    }).catch(() => undefined);
  }
  useEffect(() => { load().catch(() => undefined); }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      if (form.password !== form.passwordConfirm) {
        throw new Error("تکرار رمز عبور با رمز عبور یکسان نیست");
      }
      await api("/users", { method: "POST", body: JSON.stringify(form) });
      setOpen(false);
      setForm(empty);
      await load();
    });
  }

  return (
    <div>
      <PageHeader
        title="کاربران سامانه"
        subtitle="کاربر ارشد دسترسی کامل دارد. دبیر فقط برنامه خود و ثبت حضور و غیاب را می‌بیند."
        actions={<Button onClick={() => setOpen(true)}>کاربر جدید</Button>}
      />
      <Alert message={error} />
      {loading ? <Loading label="در حال دریافت کاربران..." /> : (
      <ResponsiveRecords
        rows={rows}
        rowKey={(row) => row.id}
        columns={[
          { id: "username", header: "نام کاربری", primary: true, cell: (row) => row.username },
          { id: "role", header: "نقش", cell: (row) => row.role === "ADMIN" ? "کاربر ارشد" : "دبیر" },
          { id: "teacher", header: "دبیر مرتبط", cell: (row) => row.teacher ? fullName(row.teacher) : "-" },
        ]}
        actions={(row) => (
          <Button variant="danger" onClick={() => {
            if (!confirm("حذف کاربر؟")) return;
            run(async () => {
              await api(`/users/${row.id}`, { method: "DELETE" });
              await load();
            }).catch(() => undefined);
          }}>حذف</Button>
        )}
      />
      )}
      <Modal open={open} title="تعریف کاربر" onClose={() => setOpen(false)}>
        <FormGrid onSubmit={save}>
          <Alert message={error} inline className="md:col-span-2" />
          <Input label="نام کاربری" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <PasswordInput label="رمز عبور" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="new-password" minLength={6} />
          <PasswordInput label="تکرار رمز عبور" value={form.passwordConfirm} onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })} required autoComplete="new-password" minLength={6} />
          <Select label="نقش" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "TEACHER" })}>
            <option value="ADMIN">کاربر ارشد</option>
            <option value="TEACHER">دبیر</option>
          </Select>
          {form.role === "TEACHER" && (
            <Select label="دبیر" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} required>
              <option value="">انتخاب دبیر</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{fullName(t)}</option>)}
            </Select>
          )}
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button disabled={busy}>ایجاد کاربر</Button>
          </div>
        </FormGrid>
      </Modal>
    </div>
  );
}
