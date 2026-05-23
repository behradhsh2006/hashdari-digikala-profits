import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Calculator, Save, Trash2, TrendingUp, Receipt, Wallet, Package } from "lucide-react";
import { formatToman, parseNumber } from "@/lib/format";

type HistoryItem = {
  id: string;
  name: string;
  purchase: number;
  fixed: number;
  profit: number;
  commission: number;
  finalPrice: number;
  createdAt: number;
};

const STORAGE_KEY = "digikala-pricing-history";

function NumberField({
  id, label, value, onChange, placeholder,
}: { id: string; label: string; value: number; onChange: (v: number) => void; placeholder?: string }) {
  const [text, setText] = useState(value ? formatToman(value) : "");
  useEffect(() => {
    setText(value ? formatToman(value) : "");
  }, [value]);
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="numeric"
          dir="ltr"
          className="text-left pr-16 h-12 text-base"
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            const n = parseNumber(e.target.value);
            setText(n ? formatToman(n) : e.target.value.replace(/[^\d۰-۹٠-٩,،\s]/g, ""));
            onChange(n);
          }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
          تومان
        </span>
      </div>
    </div>
  );
}

export function PricingCalculator() {
  const [name, setName] = useState("");
  const [purchase, setPurchase] = useState(0);
  const [fixed, setFixed] = useState(0);
  const [profit, setProfit] = useState(0);
  const [commission, setCommission] = useState(10);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const { finalPrice, commissionAmount, totalCosts, netProfit, valid } = useMemo(() => {
    const totalCosts = purchase + fixed;
    const denom = 1 - commission / 100;
    const valid = denom > 0 && (purchase + fixed + profit) > 0;
    const finalPrice = valid ? (totalCosts + profit) / denom : 0;
    const commissionAmount = finalPrice * (commission / 100);
    return { finalPrice, commissionAmount, totalCosts, netProfit: profit, valid };
  }, [purchase, fixed, profit, commission]);

  const persistHistory = (next: HistoryItem[]) => {
    setHistory(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const save = () => {
    if (!valid) {
      toast.error("لطفاً مقادیر معتبر وارد کنید");
      return;
    }
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      name: name.trim() || "محصول بدون نام",
      purchase, fixed, profit, commission, finalPrice,
      createdAt: Date.now(),
    };
    persistHistory([item, ...history].slice(0, 50));
    toast.success("در تاریخچه ذخیره شد");
  };

  const remove = (id: string) => persistHistory(history.filter((h) => h.id !== id));
  const clearAll = () => persistHistory([]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Calculator className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-primary-foreground/80 text-sm">ابزار فروشندگان دیجی‌کالا</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground leading-tight">
            ماشین‌حساب قیمت‌گذاری محصول
          </h1>
          <p className="text-primary-foreground/85 mt-3 max-w-2xl text-base md:text-lg">
            قیمت فروش نهایی را با درنظر گرفتن کمیسیون دیجی‌کالا و سود خالص دلخواه خود محاسبه کنید.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Inputs */}
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

              <NumberField id="purchase" label="قیمت خرید (تومان)" value={purchase} onChange={setPurchase} placeholder="۰" />
              <NumberField id="fixed" label="هزینه‌های ثابت (بسته‌بندی، ارسال، ...)" value={fixed} onChange={setFixed} placeholder="۰" />
              <NumberField id="profit" label="سود خالص مورد انتظار" value={profit} onChange={setProfit} placeholder="۰" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">درصد کمیسیون دیجی‌کالا</Label>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {formatToman(commission)}٪
                  </span>
                </div>
                <Slider
                  value={[commission]}
                  onValueChange={(v) => setCommission(v[0])}
                  min={0} max={30} step={0.5}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>۰٪</span><span>۱۵٪</span><span>۳۰٪</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-8">
              <Button onClick={save} size="lg" className="gap-2 flex-1 md:flex-none">
                <Save className="h-4 w-4" />
                ذخیره در تاریخچه
              </Button>
              <Button
                variant="outline" size="lg"
                onClick={() => { setName(""); setPurchase(0); setFixed(0); setProfit(0); setCommission(10); }}
              >
                پاک‌کردن فرم
              </Button>
            </div>
          </Card>

          {/* Results */}
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

        {/* History */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">تاریخچه قیمت‌گذاری</h2>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-muted-foreground">
                <Trash2 className="h-4 w-4" /> پاک‌کردن همه
              </Button>
            )}
          </div>

          {history.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground border-dashed">
              هنوز موردی ذخیره نشده است. پس از محاسبه، دکمه «ذخیره در تاریخچه» را بزنید.
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {history.map((h) => (
                <Card key={h.id} className="p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{h.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(h.createdAt).toLocaleString("fa-IR")}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(h.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-secondary">
                    <p className="text-xs text-muted-foreground">قیمت فروش نهایی</p>
                    <p className="text-xl font-extrabold text-primary tabular-nums">
                      {formatToman(h.finalPrice)} <span className="text-xs font-normal text-muted-foreground">تومان</span>
                    </p>
                  </div>
                  <dl className="mt-3 text-sm space-y-1.5">
                    <Row k="خرید" v={h.purchase} />
                    <Row k="هزینه ثابت" v={h.fixed} />
                    <Row k="سود خالص" v={h.profit} />
                    <Row k="کمیسیون" v={`${formatToman(h.commission)}٪`} raw />
                  </dl>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        ساخته شده برای فروشندگان دیجی‌کالا
      </footer>
    </div>
  );
}

function Row({ k, v, raw }: { k: string; v: number | string; raw?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="tabular-nums font-medium">
        {raw ? v : <>{formatToman(v as number)} <span className="text-xs text-muted-foreground">ت</span></>}
      </dd>
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
