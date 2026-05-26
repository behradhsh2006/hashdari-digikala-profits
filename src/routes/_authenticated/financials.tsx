import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Wallet, TrendingUp, Receipt, Truck } from "lucide-react";
import { formatToman } from "@/lib/format";
import { PermissionGate } from "@/components/PermissionGate";
import { toJalali } from "@/lib/jalali";

export const Route = createFileRoute("/_authenticated/financials")({
  head: () => ({ meta: [{ title: "گزارش مالی دیجی‌کالا — سرفیس استور" }] }),
  component: () => <PermissionGate perm="view_financials"><Inner /></PermissionGate>,
});

const MOCK = {
  grossSales: 482_500_000,
  commissions: 38_600_000,
  logistics: 12_400_000,
  netPayout: 431_500_000,
  settlements: [
    { id: "S-2026-051", amount: 215_000_000, date: Date.now() - 3 * 86400000 },
    { id: "S-2026-050", amount: 198_500_000, date: Date.now() - 10 * 86400000 },
  ],
};

function Inner() {
  return (
    <div className="space-y-6 max-w-6xl">
      <Card className="p-5 text-sm border-primary/20 bg-primary/5">
        <p className="font-bold">گزارش مالی دیجی‌کالا (داده نمونه)</p>
        <p className="text-muted-foreground mt-1">
          پس از تنظیم کلید API دیجی‌کالا در صفحه تنظیمات، داده‌های واقعی فروش، کمیسیون و تسویه نمایش داده می‌شوند.
        </p>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<TrendingUp />} label="فروش ناخالص" value={MOCK.grossSales} tone="primary" />
        <Stat icon={<Receipt />} label="کمیسیون دیجی‌کالا" value={MOCK.commissions} tone="destructive" />
        <Stat icon={<Truck />} label="هزینه لجستیک" value={MOCK.logistics} tone="muted" />
        <Stat icon={<Wallet />} label="خالص قابل پرداخت" value={MOCK.netPayout} tone="success" />
      </div>

      <Card className="p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="font-bold mb-4">آخرین تسویه‌حساب‌ها</h2>
        <div className="space-y-2">
          {MOCK.settlements.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-semibold text-sm">{s.id}</p>
                <p className="text-[11px] text-muted-foreground">{toJalali(s.date)}</p>
              </div>
              <span className="font-bold tabular-nums text-success">{formatToman(s.amount)} تومان</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "primary" | "success" | "destructive" | "muted" }) {
  const c = tone === "success" ? "text-success bg-success/10"
    : tone === "destructive" ? "text-destructive bg-destructive/10"
    : tone === "primary" ? "text-primary bg-primary/10" : "text-foreground bg-muted";
  return (
    <Card className="p-4" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-2 ${c}`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-extrabold tabular-nums mt-1">{formatToman(value)}</p>
      <p className="text-[10px] text-muted-foreground">تومان</p>
    </Card>
  );
}
