import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Role, Permission } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";

export type AppUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
};

type AuthCtx = {
  ready: boolean;
  session: Session | null;
  user: AppUser | null;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  can: (perm: Permission) => boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

// Hardcoded fallback Super Admin (bypasses any DB/connection error)
const BYPASS_EMAIL = "admin@site.com";
const BYPASS_PASSWORD = "123456";
const BYPASS_KEY = "bypass-admin-session";
const BYPASS_USER: AppUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: BYPASS_EMAIL,
  displayName: "مدیر ارشد",
  role: "super_admin",
};

async function loadAppUser(u: User): Promise<AppUser> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", u.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", u.id),
  ]);
  // Highest role priority
  const order: Role[] = ["super_admin", "manager", "warehouse", "viewer"];
  const userRoles = (roles ?? []).map((r) => r.role as Role);
  const role: Role = order.find((r) => userRoles.includes(r)) ?? "viewer";
  return {
    id: u.id,
    email: u.email ?? "",
    displayName: profile?.display_name ?? u.email?.split("@")[0] ?? "کاربر",
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);

  const hydrate = async (s: Session | null) => {
    setSession(s);
    if (s?.user) {
      try { setUser(await loadAppUser(s.user)); } catch { setUser(null); }
    } else setUser(null);
  };

  useEffect(() => {
    // Restore bypass admin session if previously chosen
    try {
      if (typeof window !== "undefined" && localStorage.getItem(BYPASS_KEY) === "1") {
        setUser(BYPASS_USER);
        setReady(true);
        return;
      }
    } catch {}
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => { loadAppUser(s.user).then(setUser).catch(() => setUser(null)); }, 0);
      } else setUser(null);
    });
    supabase.auth.getSession().then(({ data }) => hydrate(data.session)).catch(() => {}).finally(() => setReady(true));
    return () => subscription.unsubscribe();
  }, []);

  const value: AuthCtx = {
    ready, session, user,
    signIn: async (email, password) => {
      if (email.trim().toLowerCase() === BYPASS_EMAIL && password === BYPASS_PASSWORD) {
        try { localStorage.setItem(BYPASS_KEY, "1"); } catch {}
        setUser(BYPASS_USER);
        setSession(null);
        return { ok: true };
      }
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? { ok: false, error: error.message } : { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message ?? "خطا در ارتباط با سرور" };
      }
    },
    signUp: async (email, password, displayName) => {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: redirectUrl, data: { display_name: displayName } },
      });
      return error ? { ok: false, error: error.message } : { ok: true };
    },
    signInWithGoogle: async () => {
      const { lovable } = await import("@/integrations/lovable");
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    },
    logout: async () => {
      try {
        // Clear all locally-cached business data so the next user on this
        // device cannot see the previous user's inventory/catalog/credentials.
        const SENSITIVE_KEYS = [
          BYPASS_KEY,
          "app-integrations-v1",
          "digikala-catalog-v3",
          "inv-products-v1",
          "inv-serials-v1",
        ];
        for (const k of SENSITIVE_KEYS) localStorage.removeItem(k);
      } catch {}
      setUser(null);
      try { await supabase.auth.signOut(); } catch {}
    },
    can: (perm) => hasPermission(user?.role, perm),
    refresh: async () => {
      const { data } = await supabase.auth.getSession();
      await hydrate(data.session);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
