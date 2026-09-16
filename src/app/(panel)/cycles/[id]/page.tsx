"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Alert, Button, FormGrid, Input, JalaliDatePicker, PageHeader, Select, useBusy } from "@/components/ui";
import { jalaliMeta } from "@/lib/format";

type CycleDetail = {
  id: string;
  name: string;
  dayCount: number;
  timeSlots: Array<{ id: string; name: string; startTime: string; endTime: string }>;
  classCycles: Array<{
    id: string;
    startDate: string;
    endDate: string;
    startCycleDay: number;
    startDateInfo?: { isLeap: boolean; yearLength: number; dayOfYear: number; year: number };
    class: { id: string; name: string };
  }>;
};

type SchoolClass = { id: string; name: string; studyingYearName: string };

export default function CycleDetailPage() {
  const params = useParams<{ id: string }>();
  const [cycle, setCycle] = useState<CycleDetail | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startCycleDay, setStartCycleDay] = useState(1);
  const { busy, error, run } = useBusy();
  const meta = jalaliMeta(startDate);

  async function load() {
    setCycle(await api<CycleDetail>(`/cycles/${params.id}`));
    setClasses(await api<SchoolClass[]>("/classes"));
  }
  useEffect(() => { load().catch(() => undefined); }, [params.id]);

  async function assign(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
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
      setClassId("");
      await load();
    });
  }

  if (!cycle) return <div>در حال بارگذاری...</div>;

  return (
    <div>
      <PageHeader
        title={cycle.name}
        subtitle={`سیکل ${cycle.dayCount} روزه — هنگام اختصاص به کلاس مشخص کنید روز شروع سیکل با کدام روز تقویم شمسی متناظر است.`}
        actions={<Link href="/cycles"><Button variant="outline">بازگشت</Button></Link>}
      />
      <Alert message={error} />
      <div className="official-card mb-6 rounded-xl p-5">
        <h3 className="mb-4 font-bold text-navy">اختصاص سیکل به کلاس</h3>
        <FormGrid onSubmit={assign}>
          <Select label="کلاس" value={classId} onChange={(e) => setClassId(e.target.value)} required>
            <option value="">انتخاب کلاس</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.studyingYearName}</option>
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
          <div className="md:col-span-2">
            <Button disabled={busy}>ثبت بازه سیکل برای کلاس</Button>
          </div>
        </FormGrid>
      </div>
      <div className="space-y-3">
        {cycle.classCycles.map((item) => (
          <div key={item.id} className="official-card flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-bold text-navy">{item.class.name}</div>
              <div className="text-sm text-muted">
                از {item.startDate} تا {item.endDate} — شروع با روز {item.startCycleDay} سیکل
                {item.startDateInfo ? ` (سال ${item.startDateInfo.yearLength} روزه)` : ""}
              </div>
            </div>
            <Link href={`/class-cycles/${item.id}`}>
              <Button>تعیین دروس و دبیران</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
