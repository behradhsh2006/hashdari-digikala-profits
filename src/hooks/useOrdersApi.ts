import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type OrdersConfig = { baseUrl: string; token: string };
export type OrdersStats = {
  totalToday: number;
  processing: number;
  pendingShipment: number;
  raw?: any;
};

const PROVIDER = "orders_api";

export function useOrdersConfig() {
  const [cfg, setCfg] = useState<OrdersConfig>({ baseUrl: "", token: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const myId = auth.user?.id ?? null;
      const { data } = await supabase
        .from("api_credentials")
        .select("credential_key, credential_value, owner_id")
        .eq("provider", PROVIDER);

      const pick: Record<string, string> = {};
      for (const r of data ?? []) {
        if (r.owner_id === null) pick[r.credential_key] = r.credential_value ?? "";
      }
      if (myId) {
        for (const r of data ?? []) {
          if (r.owner_id === myId) pick[r.credential_key] = r.credential_value ?? "";
        }
      }
      setCfg({ baseUrl: pick.baseUrl ?? "", token: pick.token ?? "" });
      setLoading(false);
    })();
  }, []);

  const save = async (c: OrdersConfig) => {
    const { data: auth } = await supabase.auth.getUser();
    const myId = auth.user?.id ?? null;
    // Scope writes to the current user when signed in; falls back to shared row
    // when there is no auth session (bypass admin / unauthenticated).
    const q = supabase.from("api_credentials").delete().eq("provider", PROVIDER);
    if (myId) await q.eq("owner_id", myId);
    else await q.is("owner_id", null);
    await supabase.from("api_credentials").insert([
      { provider: PROVIDER, credential_key: "baseUrl", label: "Orders API Base URL", credential_value: c.baseUrl, owner_id: myId },
      { provider: PROVIDER, credential_key: "token", label: "Orders Auth Token", credential_value: c.token, owner_id: myId },
    ]);
    setCfg(c);
  };

  return { cfg, setCfg, save, loading };
}

export async function testOrdersConnection(cfg: OrdersConfig): Promise<{ ok: boolean; message: string }> {
  if (!cfg.baseUrl) return { ok: false, message: "آدرس Base URL وارد نشده است" };
  try {
    const res = await fetch(cfg.baseUrl, {
      headers: { Authorization: `Bearer ${cfg.token}`, Accept: "application/json" },
    });
    if (!res.ok) return { ok: false, message: `پاسخ سرور: ${res.status}` };
    return { ok: true, message: "اتصال موفق ✓" };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "خطای ناشناخته در اتصال" };
  }
}

export function useDailyOrders() {
  const { cfg, loading: cfgLoading } = useOrdersConfig();
  const [stats, setStats] = useState<OrdersStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cfgLoading || !cfg.baseUrl) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(cfg.baseUrl, {
          headers: { Authorization: `Bearer ${cfg.token}`, Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list: any[] = Array.isArray(data) ? data : data.orders ?? data.data ?? [];
        const todayKey = new Date().toDateString();
        const today = list.filter((o) => {
          const d = new Date(o.created_at ?? o.createdAt ?? o.date ?? Date.now());
          return d.toDateString() === todayKey;
        });
        const processing = list.filter((o) => /process|pending|in_progress/i.test(String(o.status ?? ""))).length;
        const pendingShipment = list.filter((o) => /ship|deliver/i.test(String(o.status ?? "")) && !/shipped|delivered/i.test(String(o.status ?? ""))).length;
        if (!cancelled) setStats({ totalToday: today.length, processing, pendingShipment, raw: list });
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "خطا در دریافت سفارش‌ها");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cfg.baseUrl, cfg.token, cfgLoading]);

  return { stats, loading, error, configured: !!cfg.baseUrl };
}
