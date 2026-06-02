import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Truck, Clock, Loader2, RefreshCw, AlertTriangle, Zap, Store } from "lucide-react";
import { toJalali } from "@/lib/jalali";
import { PermissionGate } from "@/components/PermissionGate";
import { fetchCommitments, type Commitment } from "@/lib/digikalaApi";
import { formatToman } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/commitments")({
  head: () => ({ meta: [{ title: "تعهدات دیجی‌کالا — سرفیس استور" }] }),
  component: () => (
    <PermissionGate perm="view_commitments"><Inner /></PermissionGate>
  ),
});

const PREF_KEY = "commitments-shipping-prefs-v1";
type Prefs = { showSeller: boolean; showJet: boolean; showDigikala: boolean };
const DEFAULT_PREFS: Prefs = { showSeller: true, showJet: true, showDigikala: true };

function Inner() {
  const [today, setToday] = useState<Commitment[]>([]);
  const [yesterday, setYesterday] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(() => {
    try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}") }; } catch { return DEFAULT_PREFS; }
  });

  useEffect(() => {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {}
  }, [prefs]);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetchCommitments();
      setToday(r.today); setYesterday(r.yesterday);
    } catch (e: any) {
      setError(e?.message ?? "خطا در دریافت سفارش‌ها");
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filter = (items: Commitment[]) => items.filter((c) => {
    if (c.shippingMethod === "seller") return prefs.showSeller;
    if (c.shippingMethod === "jet") return prefs.showJet;
    if (c.shippingMethod === "digikala") return prefs.showDigikala;
    return true; // unknown → always include
  });

  const todayFiltered = useMemo(() => filter(today), [today, prefs]);
  const yesterdayFiltered = useMemo(() => filter(yesterday), [yesterday, prefs]);

  const counts = useMemo(() => {
    const all = [...today, ...yesterday];
    return {
      seller: all.filter((c) => c.shippingMethod === "seller").length,
      jet: all.filter((c) => c.shippingMethod === "jet").length,
      digikala: all.filter((c) => c.shippingMethod === "digikala").length,
    };
  }, [today, yesterday]);

  return (
    <div className="space-y-6 max-w-6xl">
      <Card className="p-5 border-primary/20 bg-primary/5 text-sm flex items-start gap-3">
        <Truck className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <p className="font-bold">تعهدات ارسال دیجی‌کالا (Live API)</p>
          <p className="text-muted-foreground mt-1">
            داده‌ها مستقیماً از Digikala Seller Open API دریافت می‌شوند. در صورت نیاز، کلیدها را در تنظیمات بروزرسانی کنید.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          بروزرسانی
        </Button>
      </Card>

      <Card className="p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <p className="font-bold text-sm mb-3">روش‌های ارسال — فیلتر سطل سفارش‌ها</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <MethodToggle
            icon={<Store className="h-4 w-4 text-primary" />}
            title="ارسال فروشنده"
            subtitle="Seller Shipping / Direct Delivery"
            count={counts.seller}
            checked={prefs.showSeller}
            onCheckedChange={(v) => setPrefs((p) => ({ ...p, showSeller: v }))}
          />
          <MethodToggle
            icon={<Zap className="h-4 w-4 text-warning" />}
            title="ارسال ۳ ساعته / دیجی‌کالا جت"
            subtitle="3-Hour Jet Delivery"
            count={counts.jet}
            checked={prefs.showJet}
            onCheckedChange={(v) => setPrefs((p) => ({ ...p, showJet: v }))}
          />
          <MethodToggle
            icon={<Truck className="h-4 w-4 text-primary" />}
            title="ارسال دیجی‌کالا (انبار)"
            subtitle="Digikala Warehouse (FBA/FBM)"
            count={counts.digikala}
            checked={prefs.showDigikala}
            onCheckedChange={(v) => setPrefs((p) => ({ ...p, showDigikala: v }))}
          />
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="font-bold text-destructive">خطا در ارتباط با دیجی‌کالا</p>
            <p className="text-muted-foreground mt-1">{error}</p>
          </div>
        </Card>
      )}

      <Section title="تعهد ارسال امروز" date={toJalali(Date.now())} items={todayFiltered} tone="primary" loading={loading} />
      <Section title="تعهد ارسال روز گذشته" date={toJalali(Date.now() - 86400000)} items={yesterdayFiltered} tone="destructive" loading={loading} />
    </div>
  );
}

function MethodToggle({ icon, title, subtitle, count, checked, onCheckedChange }: {
  icon: React.ReactNode; title: string; subtitle: string; count: number; checked: boolean; onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Label className="font-semibold text-sm">{title}</Label>
          <Badge variant="secondary" className="text-[10px]">{count}</Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function Section({ title, date, items, tone, loading }: { title: string; date: string; items: Commitment[]; tone: "primary" | "destructive"; loading: boolean }) {
  const c = tone === "primary" ? "text-primary bg-primary/10" : "text-destructive bg-destructive/10";
  return (
    <Card className="p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${c}`}><Clock className="h-5 w-5" /></div>
          <div>
            <h2 className="font-bold">{title}</h2>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
        <Badge variant="secondary">{items.length} سفارش</Badge>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">سفارشی ثبت نشده است</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between p-3 rounded-lg border gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{it.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  سفارش {it.id} {it.variantId && `• Variant ${it.variantId}`} {it.deadline && `• مهلت ${toJalali(it.deadline)}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px]">{it.status || "—"}</Badge>
                <span className="text-xs tabular-nums text-muted-foreground">{formatToman(it.price / 10)} ت</span>
                <span className="font-bold tabular-nums">×{it.qty}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
