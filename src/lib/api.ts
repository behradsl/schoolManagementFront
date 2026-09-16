export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export type AuthUser = {
  id: string;
  username: string;
  role: "ADMIN" | "TEACHER";
  teacherId: string | null;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    teachingField?: string | null;
  } | null;
};

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function setSession(token: string, user: AuthUser) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

async function readError(res: Response) {
  const data = await res.json().catch(() => ({}));
  const message = (data as { message?: string | string[] }).message;
  if (Array.isArray(message)) return message.join("، ");
  return message || "خطای غیرمنتظره در ارتباط با سرور";
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("نشست شما منقضی شده است");
  }
  if (!res.ok) throw new Error(await readError(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function downloadFile(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(await readError(res));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function uploadFile<T>(path: string, file: File): Promise<T> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as T;
}
