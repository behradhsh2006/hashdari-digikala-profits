import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, Permission } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";

export type AppUser = {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  /** Mock password (LocalStorage only — replace with real auth via Lovable Cloud). */
  password: string;
  createdAt: number;
};

const USERS_KEY = "app-users-v1";
const SESSION_KEY = "app-session-v1";

const DEFAULT_USERS: AppUser[] = [
  { id: "u-admin", username: "admin", displayName: "مدیر سیستم", role: "super_admin", password: "admin", createdAt: Date.now() },
  { id: "u-staff", username: "staff", displayName: "کارمند انبار", role: "warehouse", password: "staff", createdAt: Date.now() },
];

function loadUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}
function saveUsers(users: AppUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

type AuthCtx = {
  ready: boolean;
  user: AppUser | null;
  users: AppUser[];
  login: (username: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  can: (perm: Permission) => boolean;
  // user management (admin)
  createUser: (data: Omit<AppUser, "id" | "createdAt">) => { ok: boolean; error?: string };
  updateUser: (id: string, patch: Partial<Omit<AppUser, "id">>) => void;
  deleteUser: (id: string) => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    const all = loadUsers();
    setUsers(all);
    try {
      const sid = localStorage.getItem(SESSION_KEY);
      if (sid) {
        const u = all.find((x) => x.id === sid) ?? null;
        setUser(u);
      }
    } catch {}
    setReady(true);
  }, []);

  const persistUsers = (next: AppUser[]) => {
    setUsers(next);
    saveUsers(next);
  };

  const value: AuthCtx = {
    ready,
    user,
    users,
    login: (username, password) => {
      const u = users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
      if (!u || u.password !== password) return { ok: false, error: "نام کاربری یا رمز عبور اشتباه است" };
      localStorage.setItem(SESSION_KEY, u.id);
      setUser(u);
      return { ok: true };
    },
    logout: () => {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
    },
    can: (perm) => hasPermission(user?.role, perm),
    createUser: (data) => {
      if (!data.username.trim()) return { ok: false, error: "نام کاربری الزامی است" };
      if (users.some((x) => x.username.toLowerCase() === data.username.toLowerCase()))
        return { ok: false, error: "این نام کاربری قبلاً ثبت شده است" };
      if (!data.password || data.password.length < 3) return { ok: false, error: "رمز عبور حداقل ۳ نویسه" };
      const next: AppUser = { ...data, id: `u-${crypto.randomUUID()}`, createdAt: Date.now() };
      persistUsers([next, ...users]);
      return { ok: true };
    },
    updateUser: (id, patch) => {
      const next = users.map((u) => (u.id === id ? { ...u, ...patch } : u));
      persistUsers(next);
      if (user?.id === id) setUser({ ...user, ...patch } as AppUser);
    },
    deleteUser: (id) => {
      if (user?.id === id) return; // cannot delete self
      persistUsers(users.filter((u) => u.id !== id));
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
