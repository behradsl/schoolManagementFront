"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Alert, Button, FormGrid, Input, Loading, Modal, PageHeader, Select, useBusy } from "@/components/ui";
import { ResponsiveRecords } from "@/components/responsive-records";

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
  const [yearId, setYearId] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [form, setForm] = useState(empty);
  const { busy, error, loading, run, loadData } = useBusy(true);

  async function load() {
    await loadData(async () => {
      const [classRows, yearRows] = await Promise.all([
        api<SchoolClass[]>("/classes"),
        api<StudyYear[]>("/study-years"),
      ]);
      const sortedYears = [...yearRows].sort((a, b) => b.startDate.localeCompare(a.startDate));
      setRows(classRows);
      setYears(sortedYears);
      setYearId((current) => current || sortedYears[0]?.id || "");
    }).catch(() => undefined);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (yearId ? rows.filter((row) => row.studyYearId === yearId) : rows),
    [rows, yearId],
  );

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
        actions={<Button onClick={() => { setEditing(null); setForm({ ...empty, studyYearId: yearId || years[0]?.id || "" }); setOpen(true); }}>کلاس جدید</Button>}
      />
      <div className="mb-4 max-w-sm">
        <Select label="سال تحصیلی" value={yearId} onChange={(e) => setYearId(e.target.value)}>
          <option value="">همه سال‌ها</option>
          {years.map((year) => (
            <option key={year.id} value={year.id}>{year.name}</option>
          ))}
        </Select>
      </div>
      <Alert message={error} />
      {years.length === 0 && !loading && (
        <Alert message="ابتدا از بخش مدرسه و سال تحصیلی، یک سال تحصیلی تعریف کنید." />
      )}
      {loading ? (
        <Loading label="در حال دریافت کلاس‌ها..." />
      ) : (
        <ResponsiveRecords
          rows={filtered}
          rowKey={(row) => row.id}
          empty="کلاسی برای این سال تحصیلی یافت نشد."
          columns={[
            { id: "name", header: "نام کلاس", primary: true, cell: (row) => row.name },
            { id: "field", header: "رشته", cell: (row) => row.fieldOfStudy },
            { id: "level", header: "مقطع", cell: (row) => row.level },
            { id: "count", header: "تعداد دانش‌آموز", cell: (row) => row._count?.students ?? 0 },
          ]}
          actions={(row) => (
            <>
              <Button asChild variant="outline">
                <Link href={`/classes/${row.id}`}>فهرست دانش‌آموزان</Link>
              </Button>
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
            </>
          )}
        />
      )}
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
