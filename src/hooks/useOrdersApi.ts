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
      const { data } = await supabase
        .from("api_credentials")
        .select("credential_key, credential_value")
        .eq("provider", PROVIDER);
      const next: OrdersConfig = { baseUrl: "", token: "" };
      for (const r of data ?? []) {
        if (r.credential_key === "baseUrl") next.baseUrl = r.credential_value ?? "";
        if (r.credential_key === "token") next.token = r.credential_value ?? "";
      }
      setCfg(next);
      setLoading(false);
    })();
  }, []);

  const save = async (c: OrdersConfig) => {
    await supabase.from("api_credentials").delete().eq("provider", PROVIDER);
    await supabase.from("api_credentials").insert([
      { provider: PROVIDER, credential_key: "baseUrl", label: "Orders API Base URL", credential_value: c.baseUrl },
      { provider: PROVIDER, credential_key: "token", label: "Orders Auth Token", credential_value: c.token },
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
