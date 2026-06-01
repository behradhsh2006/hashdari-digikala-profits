import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Package, AlertTriangle, Wallet, Barcode, TrendingUp, ShoppingCart, Truck, Clock } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";
import { useCatalog } from "@/hooks/useCatalog";
import { useAedRate } from "@/hooks/useAedRate";
import { formatToman } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { useDailyOrders } from "@/hooks/useOrdersApi";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "داشبورد — سرفیس استور" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { products, serials, stockCount } = useInventory();
  const { items: catalog } = useCatalog();
  const { rate } = useAedRate();
  const { can, user } = useAuth();
  const orders = useDailyOrders();

  const inStock = serials.filter((s) => s.status === "in_stock").length;
  const sold = serials.filter((s) => s.status === "sold").length;
  const reserved = serials.filter((s) => s.status === "reserved").length;

  const lowStock = products.filter((p) => stockCount(p.id) <= p.reorderThreshold);
  const totalAssetToman = products.reduce((acc, p) => {
    const stock = stockCount(p.id);
    const cost = p.currency === "AED" ? p.costPrice * rate : p.costPrice;
    return acc + stock * cost;
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <Card className="p-6 md:p-7 text-primary-foreground border-0 overflow-hidden relative"
        style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
        <div className="relative">
          <p className="text-sm text-primary-foreground/85">سلام، {user?.displayName} 👋</p>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1">داشبورد مدیریتی</h1>
          <p className="text-primary-foreground/85 text-sm mt-2">نگاهی سریع به وضعیت موجودی و قیمت‌گذاری</p>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<Package className="h-5 w-5" />} label="تعداد محصولات" value={formatToman(products.length)} />
        <Stat icon={<Barcode className="h-5 w-5" />} label="موجود در انبار" value={formatToman(inStock)} tone="success" />
        <Stat icon={<TrendingUp className="h-5 w-5" />} label="فروخته‌شده" value={formatToman(sold)} />
        <Stat icon={<Barcode className="h-5 w-5" />} label="رزرو شده" value={formatToman(reserved)} />
      </div>

      <Card className="p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-bold">سفارش‌های روزانه مشتریان</h2>
          </div>
          {!orders.configured && (
            <Link to="/settings" className="text-xs text-primary hover:underline">پیکربندی Orders API →</Link>
          )}
        </div>
        {!orders.configured ? (
          <p className="text-sm text-muted-foreground">برای نمایش سفارش‌ها، ابتدا Orders API را در تنظیمات پیکربندی کنید.</p>
        ) : orders.error ? (
          <p className="text-sm text-destructive">خطا در دریافت سفارش‌ها: {orders.error}</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            <Stat icon={<ShoppingCart className="h-5 w-5" />} label="سفارش‌های امروز" value={formatToman(orders.stats?.totalToday ?? 0)} />
            <Stat icon={<Clock className="h-5 w-5" />} label="در حال پردازش" value={formatToman(orders.stats?.processing ?? 0)} />
            <Stat icon={<Truck className="h-5 w-5" />} label="در انتظار ارسال" value={formatToman(orders.stats?.pendingShipment ?? 0)} tone="success" />
          </div>
        )}
      </Card>


      {can("view_financials") && (
        <Card className="p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ارزش کل دارایی انبار</p>
              <p className="text-3xl font-extrabold tabular-nums text-primary">
                {formatToman(totalAssetToman)} <span className="text-sm font-normal text-muted-foreground">تومان</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            بر اساس قیمت خرید × تعداد موجود؛ کالاهای درهمی با نرخ {formatToman(rate)} تومان محاسبه شده‌اند.
          </p>
        </Card>
      )}

      <Card className="p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className={`h-5 w-5 ${lowStock.length ? "text-destructive" : "text-success"}`} />
          <h2 className="font-bold">هشدار کمبود موجودی</h2>
        </div>
        {lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground">همه محصولات بالاتر از حداقل موجودی هستند ✓</p>
        ) : (
          <div className="space-y-2">
            {lowStock.slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">SKU: {p.sku} • حداقل: {p.reorderThreshold}</p>
                </div>
                <span className="font-bold text-destructive tabular-nums">{stockCount(p.id)} عدد</span>
              </div>
            ))}
            <Link to="/inventory" className="block text-center text-sm text-primary hover:underline mt-2">
              مشاهده همه محصولات →
            </Link>
          </div>
        )}
      </Card>

      {products.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">هنوز محصولی ثبت نشده است</p>
          <p className="text-sm text-muted-foreground mt-1">از منوی «محصولات» یا «ورود اکسل» شروع کنید.</p>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center pt-4">
        کاتالوگ قیمت‌گذاری: {catalog.length} مورد
      </p>
    </div>
  );
}

function Stat({ icon, label, value, tone = "default" }: { icon: React.ReactNode; label: string; value: string; tone?: "default" | "success" }) {
  const c = tone === "success" ? "text-success bg-success/10" : "text-primary bg-primary/10";
  return (
    <Card className="p-4 flex items-center gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${c}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-extrabold tabular-nums">{value}</p>
      </div>
    </Card>
  );
}
