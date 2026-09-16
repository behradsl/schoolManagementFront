"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Alert, Button, FormGrid, Input, Modal, PageHeader, useBusy } from "@/components/ui";

type TimeSlot = { id?: string; name: string; order: number; startTime: string; endTime: string };
type Cycle = {
  id: string;
  name: string;
  dayCount: number;
  timeSlots: TimeSlot[];
  _count?: { classCycles: number };
};

const emptySlot = (): TimeSlot => ({ name: "", order: 1, startTime: "08:00", endTime: "10:00" });

export default function CyclesPage() {
  const [rows, setRows] = useState<Cycle[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cycle | null>(null);
  const [name, setName] = useState("");
  const [dayCount, setDayCount] = useState(7);
  const [slots, setSlots] = useState<TimeSlot[]>([emptySlot()]);
  const { busy, error, run } = useBusy();

  async function load() {
    setRows(await api<Cycle[]>("/cycles"));
  }
  useEffect(() => { load().catch(() => undefined); }, []);

  function startCreate() {
    setEditing(null);
    setName("");
    setDayCount(7);
    setSlots([{ name: "ساعت اول", order: 1, startTime: "08:00", endTime: "10:00" }]);
    setOpen(true);
  }

  function startEdit(row: Cycle) {
    setEditing(row);
    setName(row.name);
    setDayCount(row.dayCount);
    setSlots(row.timeSlots.length ? row.timeSlots : [emptySlot()]);
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const payload = {
        name,
        dayCount: Number(dayCount),
        timeSlots: slots.map((s, i) => ({ ...s, order: i + 1 })),
      };
      if (editing) await api(`/cycles/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await api("/cycles", { method: "POST", body: JSON.stringify(payload) });
      setOpen(false);
      await load();
    });
  }

  return (
    <div>
      <PageHeader
        title="سیکل آموزشی"
        subtitle="تعریف روزهای سیکل و ساعات آموزشی (ساعت اول، دوم و ...)"
        actions={<Button onClick={startCreate}>سیکل جدید</Button>}
      />
      <Alert message={error} />
      <div className="grid gap-4">
        {rows.map((row) => (
          <div key={row.id} className="official-card rounded-xl p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy">{row.name}</h3>
                <p className="text-sm text-muted">{row.dayCount} روز در هر سیکل · {row.timeSlots.length} ساعت آموزشی</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/cycles/${row.id}`}><Button>جزئیات و اختصاص به کلاس</Button></Link>
                <Button variant="outline" onClick={() => startEdit(row)}>ویرایش</Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {row.timeSlots.map((slot) => (
                <span key={slot.id} className="rounded-full bg-cream px-3 py-1 text-navy">
                  {slot.name}: {slot.startTime} تا {slot.endTime}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Modal open={open} title={editing ? "ویرایش سیکل" : "ثبت سیکل"} onClose={() => setOpen(false)}>
        <FormGrid onSubmit={save}>
          <Input label="نام سیکل" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="تعداد روز سیکل" type="number" min={1} value={dayCount} onChange={(e) => setDayCount(Number(e.target.value))} />
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-navy">ساعات آموزشی</h4>
              <Button type="button" variant="outline" onClick={() => setSlots([...slots, { ...emptySlot(), order: slots.length + 1, name: `ساعت ${slots.length + 1}` }])}>
                افزودن ساعت
              </Button>
            </div>
            {slots.map((slot, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 rounded-md border border-line p-3 md:grid-cols-4">
                <Input label="نام ساعت" value={slot.name} onChange={(e) => {
                  const next = [...slots];
                  next[index] = { ...slot, name: e.target.value };
                  setSlots(next);
                }} />
                <Input label="شروع" value={slot.startTime} onChange={(e) => {
                  const next = [...slots];
                  next[index] = { ...slot, startTime: e.target.value };
                  setSlots(next);
                }} />
                <Input label="پایان" value={slot.endTime} onChange={(e) => {
                  const next = [...slots];
                  next[index] = { ...slot, endTime: e.target.value };
                  setSlots(next);
                }} />
                <Button type="button" variant="danger" className="self-end" onClick={() => setSlots(slots.filter((_, i) => i !== index))}>حذف</Button>
              </div>
            ))}
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button disabled={busy}>ذخیره</Button>
          </div>
        </FormGrid>
      </Modal>
    </div>
  );
}
