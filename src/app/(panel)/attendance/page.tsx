import { Suspense } from "react";
import AttendanceClient from "./attendance-client";
import { Loading } from "@/components/loading";

export default function Page() {
  return (
    <Suspense fallback={<Loading label="در حال بارگذاری حضور و غیاب..." />}>
      <AttendanceClient />
    </Suspense>
  );
}
