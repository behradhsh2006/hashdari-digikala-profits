import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, TrendingUp, Receipt, Wallet, Package } from "lucide-react";
import { formatToman, parseNumber } from "@/lib/format";
import { calcPricing } from "@/lib/pricing";
import { getAutoImageUrl } from "@/lib/productImage";
import type { CatalogItem, Currency } from "@/hooks/useCatalog";

function NumberField({
  id, label, value, onChange, placeholder, suffix = "تومان",
}: { id: string; label: string; value: number; onChange: (v: number) => void; placeholder?: string; suffix?: string }) {
  const [text, setText] = useState(value ? formatToman(value) : "");
  useEffect(() => { setText(value ? formatToman(value) : ""); }, [value]);
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          id={id} inputMode="numeric" dir="ltr"
          className="text-left pr-16 h-12 text-base"
          value={text} placeholder={placeholder}
          onChange={(e) => {
            const n = parseNumber(e.target.value);
            setText(n ? formatToman(n) : e.target.value.replace(/[^\d۰-۹٠-٩,،\s.]/g, ""));
            onChange(n);
          }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      </div>
    </div>
  );
}

export function SingleCalculator({
  onSave, aedRate,
}: { onSave: (item: CatalogItem) => void; aedRate: number }) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency>("TOMAN");
  const [purchase, setPurchase] = useState(0);
  const [fixed, setFixed] = useState(0);
  const [profit, setProfit] = useState(0);
  const [commission, setCommission] = useState(10);

  const purchaseToman = currency === "AED" ? purchase * aedRate : purchase;

  const { finalPrice, commissionAmount, totalCosts, netProfit, valid } = useMemo(
    () => calcPricing(purchaseToman, fixed, profit, commission),
    [purchaseToman, fixed, profit, commission],
  );

  const save = () => {
    if (!valid || !name.trim()) {
      toast.error("نام محصول و حداقل یک مقدار را وارد کنید");
      return;
    }
    const item: CatalogItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      purchaseOriginal: purchase,
      currency,
      aedRateUsed: currency === "AED" ? aedRate : 0,
      purchase: purchaseToman,
      fixed, profit, commission,
      finalPrice, commissionAmount,
      imageUrl: getAutoImageUrl(name.trim()),
      createdAt: Date.now(),
    };
    onSave(item);
    toast.success("به لیست کالاها اضافه شد");
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <Card className="lg:col-span-3 p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-6">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">اطلاعات محصول</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">نام محصول</Label>
            <Input
              id="name" value={name} onChange={(e) => setName(e.target.value)}
              className="h-12 text-base" placeholder="مثلاً هدفون بلوتوثی مدل X"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">ارز قیمت خرید</Label>
            <div className="grid grid-cols-2 gap-2 h-12">
              <button type="button" onClick={() => setCurrency("TOMAN")}
                className={`rounded-md border text-sm font-medium transition ${currency === "TOMAN" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-accent"}`}>
                تومان
              </button>
              <button type="button" onClick={() => setCurrency("AED")}
                className={`rounded-md border text-sm font-medium transition ${currency === "AED" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-accent"}`}>
                درهم (AED)
              </button>
            </div>
          </div>

          <NumberField
            id="purchase"
            label={currency === "AED" ? `قیمت خرید (درهم) — معادل: ${formatToman(purchaseToman)} ت` : "قیمت خرید"}
            value={purchase} onChange={setPurchase} placeholder="۰"
            suffix={currency === "AED" ? "درهم" : "تومان"}
          />
          <NumberField id="fixed" label="هزینه‌های ثابت (بسته‌بندی، ارسال، ...)" value={fixed} onChange={setFixed} placeholder="۰" />
          <NumberField id="profit" label="سود خالص مورد انتظار" value={profit} onChange={setProfit} placeholder="۰" />

          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">درصد کمیسیون دیجی‌کالا</Label>
              <span className="text-lg font-bold text-primary tabular-nums">
                {formatToman(commission)}٪
              </span>
            </div>
            <Slider value={[commission]} onValueChange={(v) => setCommission(v[0])} min={0} max={30} step={0.5} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>۰٪</span><span>۱۵٪</span><span>۳۰٪</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-8">
          <Button onClick={save} size="lg" className="gap-2 flex-1 md:flex-none">
            <Save className="h-4 w-4" />
            افزودن به لیست کالاها
          </Button>
          <Button
            variant="outline" size="lg"
            onClick={() => { setName(""); setPurchase(0); setFixed(0); setProfit(0); setCommission(10); setCurrency("TOMAN"); }}
          >
            پاک‌کردن فرم
          </Button>
        </div>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <Card
          className="p-6 md:p-8 text-primary-foreground border-0 relative overflow-hidden"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
        >
          <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <p className="text-sm text-primary-foreground/85 mb-2">قیمت فروش نهایی</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl md:text-5xl font-extrabold tabular-nums">
              {formatToman(finalPrice)}
            </span>
            <span className="text-base text-primary-foreground/85">تومان</span>
          </div>
          {!valid && (
            <p className="text-xs text-primary-foreground/85 mt-3">
              برای محاسبه، حداقل یکی از مقادیر را وارد کنید.
            </p>
          )}
        </Card>

        <Card className="p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h3 className="font-bold mb-4">جزئیات محاسبه</h3>
          <BreakdownRow
            icon={<Receipt className="h-4 w-4" />}
            label="کمیسیون دیجی‌کالا" sub={`${formatToman(commission)}٪ از قیمت فروش`}
            value={commissionAmount} tone="destructive"
          />
          <Separator className="my-3" />
          <BreakdownRow
            icon={<Wallet className="h-4 w-4" />}
            label="مجموع هزینه‌ها" sub="خرید + هزینه‌های ثابت"
            value={totalCosts} tone="muted"
          />
          <Separator className="my-3" />
          <BreakdownRow
            icon={<TrendingUp className="h-4 w-4" />}
            label="سود خالص شما" sub="پس از کسر کمیسیون و هزینه‌ها"
            value={netProfit} tone="success"
          />
        </Card>
      </div>
    </div>
  );
}

function BreakdownRow({
  icon, label, sub, value, tone,
}: { icon: React.ReactNode; label: string; sub: string; value: number; tone: "destructive" | "muted" | "success" }) {
  const toneClass =
    tone === "destructive" ? "text-destructive bg-destructive/10"
    : tone === "success" ? "text-success bg-success/10"
    : "text-muted-foreground bg-muted";
  return (
    <div className="flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${toneClass}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <div className="text-left">
        <p className="font-bold tabular-nums">{formatToman(value)}</p>
        <p className="text-[10px] text-muted-foreground">تومان</p>
      </div>
    </div>
  );
}
