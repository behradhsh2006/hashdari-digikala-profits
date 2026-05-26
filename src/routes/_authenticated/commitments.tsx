import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Clock } from "lucide-react";
import { toJalali } from "@/lib/jalali";
import { PermissionGate } from "@/components/PermissionGate";

export const Route = createFileRoute("/_authenticated/commitments")({
  head: () => ({ meta: [{ title: "تعهدات دیجی‌کالا — سرفیس استور" }] }),
  component: () => (
    <PermissionGate perm="view_commitments"><Inner /></PermissionGate>
  ),
});

const MOCK_TODAY = [
  { id: "DK-10234", product: "Surface Pro 11 — 256GB", qty: 1, address: "تهران، انبار دیجی‌کالا" },
  { id: "DK-10235", product: "Surface Laptop 7 — 512GB", qty: 1, address: "تهران، انبار دیجی‌کالا" },
];
const MOCK_YESTERDAY = [
  { id: "DK-10198", product: "Surface Pro 9", qty: 1, address: "تهران", late: true },
];

function Inner() {
  return (
    <div className="space-y-6 max-w-6xl">
      <Card className="p-5 border-primary/20 bg-primary/5 text-sm flex items-start gap-3">
        <Truck className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-bold">تعهدات ارسال دیجی‌کالا</p>
          <p className="text-muted-foreground mt-1">
            داده‌های نمونه نمایش داده می‌شود. پس از اتصال API دیجی‌کالا در صفحه تنظیمات، سفارش‌های واقعی نمایش داده می‌شوند.
          </p>
        </div>
      </Card>

      <Section title="تعهد ارسال امروز" date={toJalali(Date.now())} items={MOCK_TODAY} tone="primary" />
      <Section title="تعهد ارسال روز گذشته" date={toJalali(Date.now() - 86400000)} items={MOCK_YESTERDAY} tone="destructive" />
    </div>
  );
}

function Section({ title, date, items, tone }: { title: string; date: string; items: any[]; tone: "primary" | "destructive" }) {
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
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">سفارشی ثبت نشده است</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-semibold text-sm">{it.product}</p>
                <p className="text-[11px] text-muted-foreground">سفارش {it.id} • {it.address}</p>
              </div>
              <div className="flex items-center gap-2">
                {it.late && <Badge variant="destructive" className="text-[10px]">با تأخیر</Badge>}
                <span className="font-bold tabular-nums">{it.qty}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
