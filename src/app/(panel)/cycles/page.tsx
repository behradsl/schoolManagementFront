"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Alert,
  Button,
  FormGrid,
  Input,
  JalaliDatePicker,
  Modal,
  PageHeader,
  Select,
  Textarea,
  useBusy,
} from "@/components/ui";
import { EXCEPTION_LABEL } from "@/lib/format";

type TimeSlot = {
  id?: string;
  cycleDay: number;
  name: string;
  order: number;
  startTime: string;
  endTime: string;
};

type Cycle = {
  id: string;
  name: string;
  dayCount: number;
  timeSlots: TimeSlot[];
  _count?: { classCycles: number };
};

type CalendarException = {
  id: string;
  title: string;
  type: "HOLIDAY" | "CLOSURE";
  startDate: string;
  endDate: string;
  note?: string | null;
};

const HOUR_TEMPLATES = [
  { name: "ساعت اول", startTime: "08:00", endTime: "10:00" },
  { name: "ساعت دوم", startTime: "10:30", endTime: "12:30" },
  { name: "ساعت سوم", startTime: "13:30", endTime: "15:30" },
];

function defaultSlots(dayCount: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let day = 1; day <= dayCount; day += 1) {
    const count = dayCount >= 5 ? (day <= 4 ? 3 : day === 5 ? 2 : 0) : 3;
    for (let i = 0; i < count; i += 1) {
      slots.push({ ...HOUR_TEMPLATES[i], cycleDay: day, order: i + 1 });
    }
  }
  return slots;
}

function summarizeSlots(cycle: Cycle) {
  return Array.from({ length: cycle.dayCount }, (_, i) => {
    const count = cycle.timeSlots.filter((slot) => slot.cycleDay === i + 1).length;
    return count ? `روز ${i + 1}: ${count} ساعت` : `روز ${i + 1}: بدون کلاس`;
  }).join(" · ");
}

export default function CyclesPage() {
  const [rows, setRows] = useState<Cycle[]>([]);
  const [exceptions, setExceptions] = useState<CalendarException[]>([]);
  const [open, setOpen] = useState(false);
  const [holidayOpen, setHolidayOpen] = useState(false);
  const [editing, setEditing] = useState<Cycle | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<CalendarException | null>(null);
  const [name, setName] = useState("");
  const [dayCount, setDayCount] = useState(7);
  const [slots, setSlots] = useState<TimeSlot[]>(defaultSlots(7));
  const [holidayTitle, setHolidayTitle] = useState("");
  const [holidayType, setHolidayType] = useState<"HOLIDAY" | "CLOSURE">("HOLIDAY");
  const [holidayStart, setHolidayStart] = useState("");
  const [holidayEnd, setHolidayEnd] = useState("");
  const [holidayNote, setHolidayNote] = useState("");
  const { busy, error, success, run } = useBusy();
  const days = useMemo(() => Array.from({ length: Number(dayCount) || 1 }, (_, i) => i + 1), [dayCount]);

  async function load() {
    const [cycleRows, holidayRows] = await Promise.all([
      api<Cycle[]>("/cycles"),
      api<CalendarException[]>("/calendar-exceptions"),
    ]);
    setRows(cycleRows);
    setExceptions(holidayRows);
  }
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  function startCreate() {
    setEditing(null);
    setName("");
    setDayCount(7);
    setSlots(defaultSlots(7));
    setOpen(true);
  }

  function startEdit(row: Cycle) {
    setEditing(row);
    setName(row.name);
    setDayCount(row.dayCount);
    setSlots(row.timeSlots.length ? row.timeSlots : defaultSlots(row.dayCount));
    setOpen(true);
  }

  function changeDayCount(next: number) {
    const count = Math.max(1, next);
    setDayCount(count);
    setSlots((current) => current.filter((slot) => slot.cycleDay <= count));
  }

  function slotsForDay(day: number) {
    return slots.filter((slot) => slot.cycleDay === day).sort((a, b) => a.order - b.order);
  }

  function replaceDaySlots(day: number, next: TimeSlot[]) {
    setSlots((current) => [
      ...current.filter((slot) => slot.cycleDay !== day),
      ...next.map((slot, index) => ({ ...slot, cycleDay: day, order: index + 1 })),
    ]);
  }

  function addSlot(day: number) {
    const current = slotsForDay(day);
    const template = HOUR_TEMPLATES[current.length] ?? {
      name: `ساعت ${current.length + 1}`,
      startTime: "08:00",
      endTime: "10:00",
    };
    replaceDaySlots(day, [...current, { ...template, cycleDay: day, order: current.length + 1 }]);
  }

  function copyPreviousDay(day: number) {
    if (day <= 1) return;
    replaceDaySlots(
      day,
      slotsForDay(day - 1).map((slot) => ({ ...slot, id: undefined, cycleDay: day })),
    );
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const payload = {
        name,
        dayCount: Number(dayCount),
        timeSlots: days.flatMap((day) =>
          slotsForDay(day).map((slot, index) => ({ ...slot, cycleDay: day, order: index + 1 })),
        ),
      };
      if (editing) await api(`/cycles/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await api("/cycles", { method: "POST", body: JSON.stringify(payload) });
      setOpen(false);
      await load();
    }, "سیکل ذخیره شد");
  }

  function startHoliday(row?: CalendarException) {
    setEditingHoliday(row ?? null);
    setHolidayTitle(row?.title ?? "");
    setHolidayType(row?.type ?? "HOLIDAY");
    setHolidayStart(row?.startDate ?? "");
    setHolidayEnd(row?.endDate ?? "");
    setHolidayNote(row?.note ?? "");
    setHolidayOpen(true);
  }

  async function saveHoliday(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const payload = {
        title: holidayTitle,
        type: holidayType,
        startDate: holidayStart,
        endDate: holidayEnd || holidayStart,
        note: holidayNote,
      };
      if (editingHoliday) {
        await api(`/calendar-exceptions/${editingHoliday.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/calendar-exceptions", { method: "POST", body: JSON.stringify(payload) });
      }
      setHolidayOpen(false);
      await load();
    }, "تعطیلی ذخیره شد");
  }

  async function removeHoliday(id: string) {
    await run(async () => {
      await api(`/calendar-exceptions/${id}`, { method: "DELETE" });
      await load();
    }, "تعطیلی حذف شد");
  }

  return (
    <div>
      <PageHeader
        title="سیکل آموزشی"
        subtitle="ساعات هر روز سیکل را جداگانه تعریف کنید و تعطیلات رسمی یا اضطراری را مشخص نمایید."
        actions={<Button onClick={startCreate}>سیکل جدید</Button>}
      />
      <Alert message={error} />
      <Alert message={success} type="success" />

      <section className="official-card mb-6 rounded-xl p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy">تعطیلات و روزهای خاص</h2>
            <p className="text-sm text-muted">نوروز، سرما، آلودگی هوا و هر بازه بدون کلاس در کل مدرسه.</p>
          </div>
          <Button variant="outline" onClick={() => startHoliday()}>ثبت تعطیلی</Button>
        </div>
        {exceptions.length === 0 && (
          <p className="text-sm text-muted">هنوز تعطیلی ثبت نشده است.</p>
        )}
        <div className="grid gap-3">
          {exceptions.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-line bg-cream/60 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-bold text-navy">{item.title}</div>
                <div className="text-sm text-muted">
                  {EXCEPTION_LABEL[item.type]} · از {item.startDate} تا {item.endDate}
                  {item.note ? ` — ${item.note}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => startHoliday(item)}>ویرایش</Button>
                <Button variant="danger" onClick={() => removeHoliday(item.id)}>حذف</Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4">
        {rows.map((row) => (
          <div key={row.id} className="official-card rounded-xl p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy">{row.name}</h3>
                <p className="text-sm text-muted">{row.dayCount} روز در هر سیکل</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/cycles/${row.id}`}><Button>جزئیات و اختصاص به کلاس</Button></Link>
                <Button variant="outline" onClick={() => startEdit(row)}>ویرایش</Button>
              </div>
            </div>
            <p className="mt-3 text-xs leading-6 text-navy">{summarizeSlots(row)}</p>
          </div>
        ))}
      </div>

      <Modal open={open} title={editing ? "ویرایش سیکل" : "ثبت سیکل"} onClose={() => setOpen(false)} wide>
        <FormGrid onSubmit={save}>
          <Input label="نام سیکل" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="تعداد روز سیکل"
            type="number"
            min={1}
            value={dayCount}
            onChange={(e) => changeDayCount(Number(e.target.value))}
          />
          <div className="md:col-span-2 space-y-4">
            <p className="text-sm text-muted">
              برای هر روز سیکل می‌توانید تعداد ساعات متفاوت بگذارید. روز بدون ساعت یعنی در آن روز کلاس برگزار نمی‌شود.
            </p>
            {days.map((day) => {
              const daySlots = slotsForDay(day);
              return (
                <div key={day} className="rounded-lg border border-line p-3">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="font-bold text-navy">روز {day} سیکل</h4>
                    <div className="flex flex-wrap gap-2">
                      {day > 1 && (
                        <Button type="button" variant="ghost" onClick={() => copyPreviousDay(day)}>
                          کپی از روز قبل
                        </Button>
                      )}
                      <Button type="button" variant="outline" onClick={() => addSlot(day)}>
                        افزودن ساعت
                      </Button>
                    </div>
                  </div>
                  {daySlots.length === 0 && (
                    <p className="text-sm text-muted">بدون ساعت آموزشی — مناسب روزهای تعطیل سیکل.</p>
                  )}
                  <div className="space-y-2">
                    {daySlots.map((slot, index) => (
                      <div key={`${day}-${slot.id ?? index}`} className="grid grid-cols-1 gap-2 rounded-md bg-cream/70 p-3 md:grid-cols-4">
                        <Input
                          label="نام ساعت"
                          value={slot.name}
                          onChange={(e) => {
                            const next = [...daySlots];
                            next[index] = { ...slot, name: e.target.value };
                            replaceDaySlots(day, next);
                          }}
                        />
                        <Input
                          label="شروع"
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => {
                            const next = [...daySlots];
                            next[index] = { ...slot, startTime: e.target.value };
                            replaceDaySlots(day, next);
                          }}
                        />
                        <Input
                          label="پایان"
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => {
                            const next = [...daySlots];
                            next[index] = { ...slot, endTime: e.target.value };
                            replaceDaySlots(day, next);
                          }}
                        />
                        <Button
                          type="button"
                          variant="danger"
                          className="self-end"
                          onClick={() => replaceDaySlots(day, daySlots.filter((_, i) => i !== index))}
                        >
                          حذف
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button disabled={busy}>ذخیره</Button>
          </div>
        </FormGrid>
      </Modal>

      <Modal open={holidayOpen} title={editingHoliday ? "ویرایش تعطیلی" : "ثبت تعطیلی"} onClose={() => setHolidayOpen(false)}>
        <FormGrid onSubmit={saveHoliday}>
          <Input label="عنوان" value={holidayTitle} onChange={(e) => setHolidayTitle(e.target.value)} required />
          <Select label="نوع" value={holidayType} onChange={(e) => setHolidayType(e.target.value as "HOLIDAY" | "CLOSURE")}>
            <option value="HOLIDAY">تعطیل رسمی (مثل نوروز)</option>
            <option value="CLOSURE">تعطیلی اضطراری (سرما، آلودگی و ...)</option>
          </Select>
          <JalaliDatePicker label="از تاریخ" value={holidayStart} onChange={setHolidayStart} />
          <JalaliDatePicker label="تا تاریخ" value={holidayEnd} onChange={setHolidayEnd} />
          <div className="md:col-span-2">
            <Textarea label="توضیح (اختیاری)" value={holidayNote} onChange={(e) => setHolidayNote(e.target.value)} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setHolidayOpen(false)}>انصراف</Button>
            <Button disabled={busy}>ذخیره</Button>
          </div>
        </FormGrid>
      </Modal>
    </div>
  );
}
