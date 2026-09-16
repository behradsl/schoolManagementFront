import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "سامانه مدیریت اطلاعات مدرسه",
  description: "پنل مدیریت دانش‌آموزان، کلاس‌ها و حضور و غیاب",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazir.variable} antialiased`}>{children}</body>
    </html>
  );
}
