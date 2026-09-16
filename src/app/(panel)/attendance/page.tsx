import { Suspense } from "react";
import AttendanceClient from "./attendance-client";

export default function Page() {
  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <AttendanceClient />
    </Suspense>
  );
}
