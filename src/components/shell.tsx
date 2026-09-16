"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  School,
  Users,
  UserSquare2,
} from "lucide-react";
import { AuthUser, api, clearSession, setSession } from "@/lib/api";

const ADMIN_ONLY = ["/students", "/teachers", "/classes", "/cycles", "/users", "/class-cycles", "/school"];

const ALL_ITEMS = [
  { href: "/dashboard", label: "داشبورد", icon: LayoutDashboard, roles: ["ADMIN", "TEACHER"] },
  { href: "/school", label: "مدرسه و سال تحصیلی", icon: Building2, roles: ["ADMIN"] },
  { href: "/students", label: "دانش‌آموزان", icon: GraduationCap, roles: ["ADMIN"] },
  { href: "/teachers", label: "دبیران", icon: UserSquare2, roles: ["ADMIN"] },
  { href: "/classes", label: "کلاس‌ها", icon: School, roles: ["ADMIN"] },
  { href: "/cycles", label: "سیکل آموزشی", icon: CalendarDays, roles: ["ADMIN"] },
  { href: "/schedule", label: "برنامه و حضور", icon: ClipboardCheck, roles: ["ADMIN", "TEACHER"] },
  { href: "/reports", label: "گزارش‌ها", icon: BookOpen, roles: ["ADMIN", "TEACHER"] },
  { href: "/users", label: "کاربران", icon: Users, roles: ["ADMIN"] },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [schoolName, setSchoolName] = useState("سامانه مدرسه");

  useEffect(() => {
    api<{ name: string }>("/school").then((school) => setSchoolName(school.name)).catch(() => undefined);
    api<AuthUser>("/auth/me")
      .then((fresh) => {
        setSession(fresh);
        setUser(fresh);
        if (
          fresh.role === "TEACHER" &&
          ADMIN_ONLY.some((prefix) => pathname.startsWith(prefix))
        ) {
          router.replace("/schedule");
          return;
        }
        setReady(true);
      })
      .catch(() => {
        clearSession();
        router.replace("/login");
      });
  }, [router, pathname]);

  const items = useMemo(
    () => ALL_ITEMS.filter((item) => user && item.roles.includes(user.role)),
    [user],
  );

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-muted">در حال بارگذاری...</div>;
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 border-l border-navy-soft/20 bg-navy text-white lg:flex lg:flex-col">
        <div className="border-b border-white/10 px-5 py-6">
          <div className="text-xs tracking-widest text-gold">سامانه مدیریت مدرسه</div>
          <div className="mt-2 text-lg font-bold">{schoolName}</div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${
                  active ? "bg-gold text-navy" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          onClick={async () => {
            await api("/auth/logout", { method: "POST" }).catch(() => undefined);
            clearSession();
            router.replace("/login");
          }}
        >
          <LogOut size={16} />
          خروج
        </button>
      </aside>
      <div className="lg:mr-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur">
          <div className="lg:hidden font-bold text-navy">{schoolName}</div>
          <div className="mr-auto text-sm text-muted">
            {user?.role === "ADMIN" ? "کاربر ارشد" : "دبیر"}
            {user?.teacher ? ` / ${user.teacher.firstName} ${user.teacher.lastName}` : ""}
            {user ? ` — ${user.username}` : ""}
          </div>
        </header>
        <div className="flex gap-2 overflow-x-auto border-b border-line bg-paper p-2 lg:hidden">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${
                pathname.startsWith(item.href) ? "bg-navy text-white" : "bg-cream text-navy"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
