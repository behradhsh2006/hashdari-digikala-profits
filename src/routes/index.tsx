import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, FileSpreadsheet, ListOrdered, RefreshCw } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SingleCalculator } from "@/components/SingleCalculator";
import { BulkManager } from "@/components/BulkManager";
import { ProductList } from "@/components/ProductList";
import { useCatalog } from "@/hooks/useCatalog";
import { useAedRate } from "@/hooks/useAedRate";
import { formatToman, parseNumber } from "@/lib/format";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ماشین‌حساب قیمت‌گذاری دیجی‌کالا با تبدیل درهم" },
      {
        name: "description",
        content:
          "محاسبه قیمت فروش، تبدیل خودکار درهم به تومان، بارگذاری انبوه اکسل و مدیریت لیست کالاها برای فروشندگان دیجی‌کالا.",
      },
    ],
  }),
});

function Index() {
  const catalog = useCatalog();
  const { rate, setRate } = useAedRate();
  const [rateText, setRateText] = useState<string>(() => formatToman(rate));

  const onRateChange = (v: string) => {
    setRateText(v);
    const n = parseNumber(v);
    if (n > 0) setRate(n);
  };

  const recalcAll = () => {
    const n = parseNumber(rateText);
    if (!n || n <= 0) {
      toast.error("نرخ درهم نامعتبر است");
      return;
    }
    setRate(n);
    const aedItems = catalog.items.filter((i) => i.currency === "AED").length;
    if (aedItems === 0) {
      toast.info("هیچ کالای درهمی در لیست نیست");
      return;
    }
    catalog.recalcWithRate(n);
    toast.success(`${aedItems} کالای درهمی با نرخ جدید به‌روز شد`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      <header className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
        <div className="container mx-auto px-4 py-8 md:py-10 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Calculator className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-primary-foreground/80 text-sm">پنل فروشندگان دیجی‌کالا</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground leading-tight">
            ماشین‌حساب قیمت‌گذاری با تبدیل خودکار درهم
          </h1>
          <p className="text-primary-foreground/85 mt-2 max-w-2xl text-sm md:text-base">
            نرخ روز درهم را وارد کنید، کالاهای وارداتی به‌صورت خودکار به تومان تبدیل و محاسبه می‌شوند.
          </p>

          {/* Global AED rate bar */}
          <div className="mt-5 bg-white/10 backdrop-blur rounded-2xl p-3 md:p-4 border border-white/15">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="aed-rate" className="text-primary-foreground text-xs">
                  نرخ روز درهم (AED) به تومان
                </Label>
                <div className="relative">
                  <Input
                    id="aed-rate" dir="ltr" inputMode="numeric"
                    value={rateText}
                    onChange={(e) => onRateChange(e.target.value)}
                    className="h-11 text-left pr-20 text-base bg-white text-foreground"
                    placeholder="مثلاً ۱۶,۰۰۰"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    تومان / درهم
                  </span>
                </div>
              </div>
              <Button
                onClick={recalcAll} size="lg"
                className="gap-2 bg-white text-primary hover:bg-white/90 h-11 shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
                به‌روزرسانی و محاسبه مجدد لیست
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10">
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 h-12 p-1">
            <TabsTrigger value="list" className="gap-2 text-sm">
              <ListOrdered className="h-4 w-4" />
              <span className="hidden sm:inline">لیست کالاها ({catalog.items.length})</span>
              <span className="sm:hidden">لیست ({catalog.items.length})</span>
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">بارگذاری اکسل</span>
              <span className="sm:hidden">اکسل</span>
            </TabsTrigger>
            <TabsTrigger value="single" className="gap-2 text-sm">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">ماشین‌حساب تک‌محصول</span>
              <span className="sm:hidden">تکی</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <ProductList
              items={catalog.items}
              onUpdate={catalog.update}
              onRemove={catalog.remove}
              onClear={catalog.clear}
            />
          </TabsContent>

          <TabsContent value="bulk" className="mt-6">
            <BulkManager onAddToCatalog={catalog.addMany} aedRate={rate} />
          </TabsContent>

          <TabsContent value="single" className="mt-6">
            <SingleCalculator onSave={catalog.add} aedRate={rate} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        ساخته شده برای فروشندگان دیجی‌کالا
      </footer>
    </div>
  );
}
