import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, FileSpreadsheet, LayoutGrid } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { SingleCalculator } from "@/components/SingleCalculator";
import { BulkManager } from "@/components/BulkManager";
import { ProductCatalog } from "@/components/ProductCatalog";
import { useCatalog } from "@/hooks/useCatalog";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ماشین‌حساب و مدیریت محصول دیجی‌کالا" },
      {
        name: "description",
        content:
          "محاسبه قیمت فروش نهایی، بارگذاری انبوه از اکسل، تصویر خودکار محصول و خروجی اکسل برای فروشندگان دیجی‌کالا.",
      },
    ],
  }),
});

function Index() {
  const catalog = useCatalog();

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      <header className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
        <div className="container mx-auto px-4 py-10 md:py-14 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Calculator className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-primary-foreground/80 text-sm">پنل فروشندگان دیجی‌کالا</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground leading-tight">
            ماشین‌حساب و مدیریت محصول
          </h1>
          <p className="text-primary-foreground/85 mt-3 max-w-2xl text-base md:text-lg">
            قیمت‌گذاری تک‌محصول، بارگذاری انبوه اکسل، تصویر خودکار محصول و خروجی اکسل — همه در یک‌جا.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-10">
        <Tabs defaultValue="single" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 h-12 p-1">
            <TabsTrigger value="single" className="gap-2 text-sm">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">ماشین‌حساب تک‌محصول</span>
              <span className="sm:hidden">تکی</span>
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">مدیریت انبوه (اکسل)</span>
              <span className="sm:hidden">انبوه</span>
            </TabsTrigger>
            <TabsTrigger value="catalog" className="gap-2 text-sm">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">کاتالوگ ({catalog.items.length})</span>
              <span className="sm:hidden">کاتالوگ</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-6">
            <SingleCalculator onSave={catalog.add} />
          </TabsContent>

          <TabsContent value="bulk" className="mt-6">
            <BulkManager onAddToCatalog={catalog.addMany} />
          </TabsContent>

          <TabsContent value="catalog" className="mt-6">
            <ProductCatalog
              items={catalog.items}
              onUpdate={catalog.update}
              onRemove={catalog.remove}
              onClear={catalog.clear}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        ساخته شده برای فروشندگان دیجی‌کالا
      </footer>
    </div>
  );
}
