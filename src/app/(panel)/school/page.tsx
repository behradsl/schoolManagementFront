"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Alert, Button, FormGrid, Input, Loading, Modal, PageHeader, Textarea, useBusy } from "@/components/ui";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import { ResponsiveRecords } from "@/components/responsive-records";

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
  const { busy, error, success, run, loading, loadData } = useBusy(true);

  async function load() {
    await loadData(async () => {
      const [schoolRow, yearRows] = await Promise.all([
        api<School>("/school"),
        api<StudyYear[]>("/study-years"),
      ]);
      setSchool(schoolRow);
      setName(schoolRow.name);
      setAddress(schoolRow.address ?? "");
      setYears(yearRows);
    }).catch(() => undefined);
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

  async function removeYear(id: string) {
    if (!confirm("حذف این سال تحصیلی؟")) return;
    await run(async () => {
      await api(`/study-years/${id}`, { method: "DELETE" });
      await load();
    }, "سال تحصیلی حذف شد");
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
      {loading ? <Loading label="در حال دریافت اطلاعات مدرسه..." /> : (
      <>
      <section className="official-card mb-6 rounded-md p-5">
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
      <section className="official-card rounded-md p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-navy">سال‌های تحصیلی</h2>
            <p className="text-sm text-muted">برای هر سال یک بازه تاریخ تعریف کنید؛ کلاس ریاضی ۲ در ۱۴۰۵-۱۴۰۶ از همان کلاس در ۱۴۰۶-۱۴۰۷ جداست.</p>
          </div>
          <Button onClick={() => startYear()}>سال تحصیلی جدید</Button>
        </div>
        <ResponsiveRecords
          rows={years}
          rowKey={(year) => year.id}
          empty="سال تحصیلی تعریف نشده است."
          columns={[
            { id: "name", header: "نام", primary: true, cell: (year) => year.name },
            { id: "start", header: "از تاریخ", cell: (year) => year.startDate },
            { id: "end", header: "تا تاریخ", cell: (year) => year.endDate },
            { id: "classes", header: "تعداد کلاس", cell: (year) => year._count?.classes ?? 0 },
          ]}
          actions={(year) => (
            <>
              <Button variant="outline" onClick={() => startYear(year)}>ویرایش</Button>
              <Button variant="danger" onClick={() => removeYear(year.id)}>حذف</Button>
            </>
          )}
        />
      </section>
      </>
      )}
      <Modal open={open} title={editing ? "ویرایش سال تحصیلی" : "ثبت سال تحصیلی"} onClose={() => setOpen(false)}>
        <FormGrid onSubmit={saveYear}>
          <Alert message={error} inline className="md:col-span-2" />
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
