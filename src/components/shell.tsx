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
  Menu,
  School,
  Users,
  UserSquare2,
} from "lucide-react";
import { AuthUser, api, clearSession, setSession } from "@/lib/api";
import { Button } from "@/components/button";
import { Loading } from "@/components/loading";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/sheet";
import { cn } from "@/lib/cn";
import { setNavPending, subscribeNavPending } from "@/lib/nav-progress";

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

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItems({
  items,
  pathname,
  pendingHref,
  onNavigate,
}: {
  items: typeof ALL_ITEMS;
  pathname: string;
  pendingHref?: string | null;
  onNavigate?: (href: string) => void;
}) {
  return (
    <nav aria-label="منوی اصلی" className="flex flex-1 flex-col gap-1 p-3">
      {items.map((item) => {
        const active = pendingHref
          ? pendingHref === item.href
          : isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            aria-current={active ? "page" : undefined}
            onClick={() => onNavigate?.(item.href)}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              active ? "bg-gold text-navy" : "text-white/85 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon size={18} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MenuUser({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const roleLabel = user.role === "ADMIN" ? "کاربر ارشد" : "دبیر";
  const personName = user.teacher
    ? `${user.teacher.firstName} ${user.teacher.lastName}`
    : user.username;

  return (
    <div className="mt-auto border-t border-white/15 p-3">
      <div className="mb-3 rounded-md bg-white/10 px-3 py-2.5">
        <div className="font-bold text-gold">{personName}</div>
        <div className="text-xs text-white/75">{roleLabel}</div>
        {user.teacher ? <div className="text-xs text-white/60">{user.username}</div> : null}
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white focus-visible:ring-gold"
        onClick={onLogout}
      >
        <LogOut size={16} aria-hidden="true" />
        خروج
      </Button>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [schoolName, setSchoolName] = useState("سامانه مدرسه");
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ name: string }>("/school")
      .then((school) => {
        if (!cancelled && school?.name) setSchoolName(school.name);
      })
      .catch(() => undefined);
    api<AuthUser>("/auth/me")
      .then((fresh) => {
        if (cancelled) return;
        setSession(fresh);
        setUser(fresh);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
        router.replace("/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!user || user.role !== "TEACHER") return;
    if (ADMIN_ONLY.some((prefix) => pathname.startsWith(prefix))) {
      router.replace("/schedule");
    }
  }, [user, pathname, router]);

  useEffect(() => {
    setMenuOpen(false);
    setNavigating(false);
    setPendingHref(null);
    setNavPending(false);
  }, [pathname]);

  useEffect(() => subscribeNavPending(setNavigating), []);

  function beginNavigation(href: string) {
    if (isActivePath(pathname, href)) return;
    setPendingHref(href);
    setNavigating(true);
    setNavPending(true);
  }

  const items = useMemo(
    () => ALL_ITEMS.filter((item) => user && item.roles.includes(user.role)),
    [user],
  );

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    clearSession();
    router.replace("/login");
  }

  if (!ready || !user) {
    return <Loading fullScreen label="در حال ورود به سامانه..." />;
  }

  return (
    <div className="min-h-screen text-ink">
      <a href="#main-content" className="sr-only focus:inset-s-4 focus:top-4">
        پرش به محتوا
      </a>
      <aside className="fixed inset-s-0 inset-y-0 z-30 hidden w-64 flex-col bg-navy text-white lg:flex">
        <div className="border-b border-white/10 px-5 py-6">
          <div className="text-xs tracking-wide text-gold">سامانه مدیریت مدرسه</div>
          <div className="mt-2 text-lg font-bold leading-7">{schoolName}</div>
        </div>
        <NavItems items={items} pathname={pathname} pendingHref={pendingHref} onNavigate={beginNavigation} />
        <MenuUser user={user} onLogout={logout} />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="lg:hidden" id="mobile-nav">
          <SheetHeader>
            <SheetDescription>سامانه مدیریت مدرسه</SheetDescription>
            <SheetTitle>{schoolName}</SheetTitle>
          </SheetHeader>
          <NavItems
            items={items}
            pathname={pathname}
            pendingHref={pendingHref}
            onNavigate={(href) => {
              beginNavigation(href);
              setMenuOpen(false);
            }}
          />
          <MenuUser user={user} onLogout={logout} />
        </SheetContent>
      </Sheet>

      <div className="lg:ms-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur">
          <Button
            type="button"
            variant="outline"
            className="size-10 p-0 lg:hidden"
            aria-label="باز کردن منوی اصلی"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={18} />
          </Button>
          <div className="min-w-0">
            <div className="truncate font-bold text-navy lg:hidden">{schoolName}</div>
            <div className="hidden text-sm text-muted lg:block">پنل مدیریت اطلاعات آموزشی</div>
          </div>
        </header>
        <main id="main-content" className="relative p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      {navigating ? (
        <div
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-3 bg-cream/90 lg:inset-s-64"
          role="status"
          aria-live="polite"
        >
          <span className="inline-block size-12 animate-spin rounded-full border-4 border-navy/20 border-t-navy" />
          <span className="text-sm font-medium text-navy">در حال بارگذاری صفحه...</span>
        </div>
      ) : null}
    </div>
  );
}
