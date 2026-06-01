import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Clock, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
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

function Inner() {
  const [today, setToday] = useState<Commitment[]>([]);
  const [yesterday, setYesterday] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetchCommitments();
      setToday(r.today);
      setYesterday(r.yesterday);
    } catch (e: any) {
      setError(e?.message ?? "خطا در دریافت سفارش‌ها");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

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

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="font-bold text-destructive">خطا در ارتباط با دیجی‌کالا</p>
            <p className="text-muted-foreground mt-1">{error}</p>
          </div>
        </Card>
      )}

      <Section title="تعهد ارسال امروز" date={toJalali(Date.now())} items={today} tone="primary" loading={loading} />
      <Section title="تعهد ارسال روز گذشته" date={toJalali(Date.now() - 86400000)} items={yesterday} tone="destructive" loading={loading} />
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
