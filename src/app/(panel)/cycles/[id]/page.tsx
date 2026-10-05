"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Alert, Button, FormGrid, Input, Loading, PageHeader, Select, useBusy } from "@/components/ui";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import { jalaliMeta } from "@/lib/format";

type CycleDetail = {
  id: string;
  name: string;
  dayCount: number;
  timeSlots: Array<{ id: string; name: string; startTime: string; endTime: string; cycleDay: number }>;
  classCycles: Array<{
    id: string;
    startDate: string;
    endDate: string;
    startCycleDay: number;
    startDateInfo?: { isLeap: boolean; yearLength: number; dayOfYear: number; year: number };
    class: { id: string; name: string; studyYear?: { name: string } };
  }>;
};

type SchoolClass = { id: string; name: string; studyingYearName?: string; studyYear?: { name: string } };

export default function CycleDetailPage() {
  const params = useParams<{ id: string }>();
  const [cycle, setCycle] = useState<CycleDetail | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startCycleDay, setStartCycleDay] = useState(1);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const { busy, error, success, run, loadData } = useBusy(true);
  const meta = jalaliMeta(startDate);

  async function load() {
    await loadData(async () => {
      setCycle(await api<CycleDetail>(`/cycles/${params.id}`));
      setClasses(await api<SchoolClass[]>("/classes"));
    }).catch(() => undefined);
  }
  useEffect(() => { load().catch(() => undefined); }, [params.id]);

  function resetAssignForm() {
    setEditingAssignmentId(null);
    setClassId("");
    setStartDate("");
    setEndDate("");
    setStartCycleDay(1);
  }

  function startEditAssignment(item: CycleDetail["classCycles"][number]) {
    setEditingAssignmentId(item.id);
    setClassId(item.class.id);
    setStartDate(item.startDate);
    setEndDate(item.endDate);
    setStartCycleDay(item.startCycleDay);
  }

  async function assign(e: FormEvent) {
    e.preventDefault();
    const editing = editingAssignmentId;
    await run(async () => {
      if (editing) {
        await api(`/class-cycles/${editing}`, {
          method: "PATCH",
          body: JSON.stringify({
            startDate,
            endDate,
            startCycleDay: Number(startCycleDay),
          }),
        });
      } else {
        await api("/class-cycles", {
          method: "POST",
          body: JSON.stringify({
            cycleId: params.id,
            classId,
            startDate,
            endDate,
            startCycleDay: Number(startCycleDay),
          }),
        });
      }
      resetAssignForm();
      await load();
    }, editing ? "بازه سیکل ویرایش شد" : "سیکل به کلاس اختصاص داده شد");
  }

  async function removeAssignment(id: string) {
    if (!confirm("حذف اختصاص این سیکل به کلاس؟")) return;
    await run(async () => {
      await api(`/class-cycles/${id}`, { method: "DELETE" });
      if (editingAssignmentId === id) resetAssignForm();
      await load();
    }, "اختصاص سیکل حذف شد");
  }

  if (!cycle) return <Loading label="در حال دریافت سیکل..." />;

  return (
    <div>
      <PageHeader
        title={cycle.name}
        subtitle={`سیکل ${cycle.dayCount} روزه — ساعات هر روز سیکل می‌تواند متفاوت باشد. هنگام اختصاص به کلاس مشخص کنید روز شروع سیکل با کدام روز تقویم شمسی متناظر است.`}
        actions={<Button asChild variant="outline"><Link href="/cycles">بازگشت</Link></Button>}
      />
      <Alert message={error} />
      <Alert message={success} type="success" />
      <div className="official-card mb-6 rounded-md p-5">
        <h3 className="mb-3 font-bold text-navy">ساعات هر روز سیکل</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cycle.dayCount }, (_, i) => i + 1).map((day) => {
            const daySlots = cycle.timeSlots.filter((slot) => slot.cycleDay === day);
            return (
              <div key={day} className="rounded-md bg-cream px-3 py-2 text-sm">
                <div className="font-bold text-navy">روز {day}</div>
                {daySlots.length === 0 ? (
                  <div className="text-muted">بدون کلاس</div>
                ) : (
                  daySlots.map((slot) => (
                    <div key={slot.id} className="text-muted">
                      {slot.name}: {slot.startTime} تا {slot.endTime}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="official-card mb-6 rounded-md p-5">
        <h3 className="mb-4 font-bold text-navy">
          {editingAssignmentId ? "ویرایش بازه سیکل کلاس" : "اختصاص سیکل به کلاس"}
        </h3>
        <Alert message={error} inline className="md:col-span-2" />
        <FormGrid onSubmit={assign}>
          <Select label="کلاس" value={classId} onChange={(e) => setClassId(e.target.value)} required disabled={Boolean(editingAssignmentId)}>
            <option value="">انتخاب کلاس</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.studyYear?.name ?? c.studyingYearName}</option>
            ))}
          </Select>
          <Input
            label="روز سیکل برای تاریخ شروع"
            type="number"
            min={1}
            max={cycle.dayCount}
            value={startCycleDay}
            onChange={(e) => setStartCycleDay(Number(e.target.value))}
          />
          <JalaliDatePicker label="تاریخ شروع (شمسی)" value={startDate} onChange={setStartDate} />
          <JalaliDatePicker label="تاریخ پایان (شمسی)" value={endDate} onChange={setEndDate} />
          {meta && (
            <div className="md:col-span-2 rounded-md bg-cream px-3 py-2 text-sm text-navy">
              سال {meta.year} {meta.isLeap ? "کبیسه است و ۳۶۶ روز دارد" : "۳۶۵ روز دارد"}.
              تاریخ شروع، روز {meta.dayOfYear} از {meta.yearLength} این سال است.
              روز {startCycleDay} سیکل با این تاریخ متناظر خواهد بود.
            </div>
          )}
          <div className="md:col-span-2 flex justify-end gap-2">
            {editingAssignmentId && (
              <Button type="button" variant="ghost" onClick={resetAssignForm}>انصراف</Button>
            )}
            <Button disabled={busy}>{editingAssignmentId ? "ذخیره بازه" : "ثبت بازه سیکل برای کلاس"}</Button>
          </div>
        </FormGrid>
      </div>
      <div className="space-y-3">
        {cycle.classCycles.map((item) => (
          <div key={item.id} className="official-card flex flex-col gap-3 rounded-md p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-bold text-navy">{item.class.name}{item.class.studyYear?.name ? ` — ${item.class.studyYear.name}` : ""}</div>
              <div className="text-sm text-muted">
                از {item.startDate} تا {item.endDate} — شروع با روز {item.startCycleDay} سیکل
                {item.startDateInfo ? ` (سال ${item.startDateInfo.yearLength} روزه)` : ""}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => startEditAssignment(item)}>ویرایش بازه</Button>
              <Button variant="danger" onClick={() => removeAssignment(item.id)}>حذف</Button>
              <Button asChild>
                <Link href={`/class-cycles/${item.id}`}>تعیین دروس و دبیران</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
