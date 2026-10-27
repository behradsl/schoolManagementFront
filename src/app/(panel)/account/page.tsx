"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, AuthUser, setSession } from "@/lib/api";
import { Alert, Button, FormGrid, Input, Loading, PageHeader, PasswordInput, useBusy } from "@/components/ui";

export default function AccountPage() {
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const { busy, error, success, run, loading, loadData } = useBusy(true);

  useEffect(() => {
    loadData(async () => {
      const me = await api<AuthUser>("/auth/me");
      setUsername(me.username);
    }).catch(() => undefined);
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      if ((password || passwordConfirm) && !currentPassword) {
        throw new Error("برای تغییر رمز، رمز فعلی را وارد کنید");
      }
      if ((password || passwordConfirm) && password !== passwordConfirm) {
        throw new Error("تکرار رمز عبور با رمز عبور یکسان نیست");
      }
      if (password && password.length < 6) {
        throw new Error("رمز عبور باید حداقل ۶ نویسه باشد");
      }
      const body: {
        username: string;
        currentPassword?: string;
        password?: string;
        passwordConfirm?: string;
      } = { username };
      if (password) {
        body.currentPassword = currentPassword;
        body.password = password;
        body.passwordConfirm = passwordConfirm;
      }
      const updated = await api<AuthUser>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setSession(updated);
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirm("");
    }, "حساب کاربری ذخیره شد");
  }

  if (loading && !username) return <Loading label="در حال دریافت حساب..." />;

  return (
    <div>
      <PageHeader
        title="حساب کاربری"
        subtitle="نام کاربری را می‌توانید بدون رمز عوض کنید. برای رمز جدید، ابتدا رمز فعلی را وارد کنید."
      />
      <Alert message={error} />
      <Alert message={success} type="success" />
      <section className="official-card max-w-3xl rounded-md p-5">
        <FormGrid onSubmit={save}>
          <Alert message={error} inline className="md:col-span-2" />
          <Input
            label="نام کاربری"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <PasswordInput
            label="رمز فعلی"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          <PasswordInput
            label="رمز عبور جدید"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
          />
          <PasswordInput
            label="تکرار رمز عبور"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={6}
          />
          <div className="md:col-span-2 flex justify-end">
            <Button disabled={busy}>ذخیره</Button>
          </div>
        </FormGrid>
      </section>
    </div>
  );
}
