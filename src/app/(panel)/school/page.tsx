"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Alert, Button, FormGrid, Input, JalaliDatePicker, Modal, PageHeader, Textarea, useBusy } from "@/components/ui";

type School = { id: string; name: string; address?: string | null };
type StudyYear = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  _count?: { classes: number };
};

export default function SchoolPage() {
  const [school, setSchool] = useState<School | null>(null);
  const [years, setYears] = useState<StudyYear[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StudyYear | null>(null);
  const [yearName, setYearName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { busy, error, success, run } = useBusy();

  async function load() {
    const [schoolRow, yearRows] = await Promise.all([
      api<School>("/school"),
      api<StudyYear[]>("/study-years"),
    ]);
    setSchool(schoolRow);
    setName(schoolRow.name);
    setAddress(schoolRow.address ?? "");
    setYears(yearRows);
  }
  useEffect(() => { load().catch(() => undefined); }, []);

  async function saveSchool(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const saved = await api<School>("/school", {
        method: "PATCH",
        body: JSON.stringify({ name, address }),
      });
      setSchool(saved);
    }, "اطلاعات مدرسه ذخیره شد");
  }

  function startYear(row?: StudyYear) {
    setEditing(row ?? null);
    setYearName(row?.name ?? "");
    setStartDate(row?.startDate ?? "");
    setEndDate(row?.endDate ?? "");
    setOpen(true);
  }

  async function saveYear(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const payload = { name: yearName, startDate, endDate };
      if (editing) await api(`/study-years/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await api("/study-years", { method: "POST", body: JSON.stringify(payload) });
      setOpen(false);
      await load();
    }, "سال تحصیلی ذخیره شد");
  }

  return (
    <div>
      <PageHeader
        title="مدرسه و سال تحصیلی"
        subtitle="نام مدرسه در صفحه ورود و هدر سامانه نمایش داده می‌شود. کلاس‌ها به سال تحصیلی وابسته هستند."
      />
      <Alert message={error} />
      <Alert message={success} type="success" />
      <section className="official-card mb-6 rounded-xl p-5">
        <h2 className="mb-4 font-bold text-navy">مشخصات مدرسه</h2>
        <FormGrid onSubmit={saveSchool}>
          <Input label="نام مدرسه" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="md:col-span-2">
            <Textarea label="نشانی" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button disabled={busy}>ذخیره مدرسه</Button>
          </div>
        </FormGrid>
      </section>
      <section className="official-card rounded-xl p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-navy">سال‌های تحصیلی</h2>
            <p className="text-sm text-muted">برای هر سال یک بازه تاریخ تعریف کنید؛ کلاس ریاضی ۲ در ۱۴۰۵-۱۴۰۶ از همان کلاس در ۱۴۰۶-۱۴۰۷ جداست.</p>
          </div>
          <Button onClick={() => startYear()}>سال تحصیلی جدید</Button>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>نام</th>
                <th>از تاریخ</th>
                <th>تا تاریخ</th>
                <th>تعداد کلاس</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {years.map((year) => (
                <tr key={year.id}>
                  <td>{year.name}</td>
                  <td>{year.startDate}</td>
                  <td>{year.endDate}</td>
                  <td>{year._count?.classes ?? 0}</td>
                  <td>
                    <Button variant="ghost" onClick={() => startYear(year)}>ویرایش</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Modal open={open} title={editing ? "ویرایش سال تحصیلی" : "ثبت سال تحصیلی"} onClose={() => setOpen(false)}>
        <FormGrid onSubmit={saveYear}>
          <Input label="نام سال تحصیلی" value={yearName} onChange={(e) => setYearName(e.target.value)} required placeholder="1405-1406" />
          <JalaliDatePicker label="تاریخ شروع" value={startDate} onChange={setStartDate} />
          <JalaliDatePicker label="تاریخ پایان" value={endDate} onChange={setEndDate} />
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button disabled={busy}>ذخیره</Button>
          </div>
        </FormGrid>
      </Modal>
    </div>
  );
}
