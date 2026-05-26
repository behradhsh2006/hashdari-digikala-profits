import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Coins } from "lucide-react";
import { toast } from "sonner";
import { useAedRate } from "@/hooks/useAedRate";
import { useCatalog } from "@/hooks/useCatalog";
import { formatToman, parseNumber } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

export function AedRateBar() {
  const { rate, setRate } = useAedRate();
  const catalog = useCatalog();
  const { can } = useAuth();
  const [text, setText] = useState(formatToman(rate));

  const editable = can("edit_pricing");

  const onChange = (v: string) => {
    setText(v);
    const n = parseNumber(v);
    if (n > 0) setRate(n);
  };

  const recalc = () => {
    const n = parseNumber(text);
    if (!n || n <= 0) return toast.error("نرخ درهم نامعتبر است");
    setRate(n);
    const aedItems = catalog.items.filter((i) => i.currency === "AED").length;
    if (aedItems === 0) return toast.info("هیچ کالای درهمی در لیست نیست");
    catalog.recalcWithRate(n);
    toast.success(`${aedItems} کالای درهمی با نرخ جدید به‌روز شد`);
  };

  return (
    <Card className="p-4 md:p-5 text-primary-foreground border-0 overflow-hidden relative"
      style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
      <div className="flex flex-col md:flex-row md:items-end gap-3 relative">
        <div className="flex items-center gap-2 md:hidden">
          <Coins className="h-5 w-5" />
          <span className="font-bold">نرخ روز درهم</span>
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="aed-rate" className="text-primary-foreground text-xs">
            نرخ روز درهم (AED) به تومان
          </Label>
          <div className="relative">
            <Input
              id="aed-rate" dir="ltr" inputMode="numeric"
              value={text} disabled={!editable}
              onChange={(e) => onChange(e.target.value)}
              className="h-11 text-left pr-20 text-base bg-white text-foreground"
              placeholder="مثلاً ۱۶,۰۰۰"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              تومان / درهم
            </span>
          </div>
        </div>
        {editable && (
          <Button onClick={recalc} size="lg"
            className="gap-2 bg-white text-primary hover:bg-white/90 h-11 shrink-0">
            <RefreshCw className="h-4 w-4" />
            به‌روزرسانی و محاسبه مجدد
          </Button>
        )}
      </div>
    </Card>
  );
}
