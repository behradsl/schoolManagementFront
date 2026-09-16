"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setSession, AuthUser } from "@/lib/api";
import { Alert, Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api<{ accessToken: string; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setSession(data.accessToken, data.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ورود ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#1c3b5a,_#0b1f33)] p-4">
      <div className="official-card w-full max-w-md rounded-2xl p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold text-2xl font-black text-navy">
            م
          </div>
          <h1 className="text-xl font-bold text-navy">سامانه مدیریت اطلاعات مدرسه</h1>
          <p className="mt-2 text-sm text-muted">ورود به پنل مدیریت و حضور و غیاب</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="نام کاربری" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input
            label="رمز عبور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Alert message={error} />
          <Button className="w-full" disabled={busy}>
            {busy ? "در حال ورود..." : "ورود"}
          </Button>
        </form>
      </div>
    </div>
  );
}
