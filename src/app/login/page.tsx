"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setSession, AuthUser } from "@/lib/api";
import { Alert, Button, Input } from "@/components/ui";
import { Loading } from "@/components/loading";
import { setNavPending } from "@/lib/nav-progress";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [schoolName, setSchoolName] = useState("سامانه مدیریت اطلاعات مدرسه");

  useEffect(() => {
    api<{ name: string }>("/school")
      .then((school) => {
        if (school?.name) setSchoolName(school.name);
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api<{ user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setSession(data.user);
      setNavPending(true);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ورود ناموفق بود");
      setBusy(false);
    }
  }

  if (busy) {
    return <Loading fullScreen label="در حال ورود به سامانه..." />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#1763bd,_#0d4f9c)] p-4">
      <div className="official-card w-full max-w-md rounded-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold leading-8 text-navy">{schoolName}</h1>
          <p className="mt-2 text-sm leading-7 text-muted">ورود به پنل مدیریت و حضور و غیاب</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="نام کاربری" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input
            label="رمز عبور"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Alert message={error} />
          <Button className="w-full" variant="gold" disabled={busy}>
            {busy ? "در حال ورود..." : "ورود"}
          </Button>
        </form>
      </div>
    </div>
  );
}
