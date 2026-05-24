import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2, Plus,
  Image as ImageIcon, FileDown,
} from "lucide-react";
import { parseSpreadsheet, downloadExcel, downloadTemplate, type RawRow } from "@/lib/excel";
import { calcPricing } from "@/lib/pricing";
import { getAutoImageUrl } from "@/lib/productImage";
import { formatToman } from "@/lib/format";
import type { CatalogItem } from "@/hooks/useCatalog";

type Computed = RawRow & {
  id: string;
  purchaseToman: number;
  finalPrice: number;
  commissionAmount: number;
};

type Props = {
  onAddToCatalog: (items: CatalogItem[]) => void;
  aedRate: number;
};

export function BulkManager({ onAddToCatalog, aedRate }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Computed[]>([]);
  const [loading, setLoading] = useState(false);

  const compute = (parsed: RawRow[], rate: number): Computed[] =>
    parsed.map((r) => {
      const purchaseToman = r.currency === "AED" ? r.purchase * rate : r.purchase;
      const { finalPrice, commissionAmount } = calcPricing(
        purchaseToman, r.fixed, r.profit, r.commission,
      );
      return { ...r, id: crypto.randomUUID(), purchaseToman, finalPrice, commissionAmount };
    });

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    setLoading(true);
    try {
      const parsed = await parseSpreadsheet(file);
      if (parsed.length === 0) {
        toast.error("هیچ سطری در فایل پیدا نشد");
        return;
      }
      setRows(compute(parsed, aedRate));
      toast.success(`${parsed.length} سطر بارگذاری شد`);
    } catch (e) {
      console.error(e);
      toast.error("خطا در خواندن فایل");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const incompleteCount = rows.filter((r) => r.missingFields.length > 0).length;
  const validRows = rows.filter((r) => r.missingFields.length === 0);
  const aedCount = rows.filter((r) => r.currency === "AED").length;

  const recalcCurrent = () => {
    if (rows.length === 0) return;
    setRows(
      rows.map((r) => {
        const purchaseToman = r.currency === "AED" ? r.purchase * aedRate : r.purchase;
        const { finalPrice, commissionAmount } = calcPricing(
          purchaseToman, r.fixed, r.profit, r.commission,
        );
        return { ...r, purchaseToman, finalPrice, commissionAmount };
      }),
    );
    toast.success("جدول با نرخ جدید درهم محاسبه شد");
  };

  const exportCalculated = () => {
    if (rows.length === 0) return;
    const out = rows.map((r) => ({
      "نام محصول": r.name,
      "قیمت خرید": r.purchase,
      "ارز": r.currency === "AED" ? "درهم" : "تومان",
      "قیمت خرید (تومان)": Math.round(r.purchaseToman),
      "هزینه ثابت": r.fixed,
      "سود خالص": r.profit,
      "کمیسیون (٪)": r.commission,
      "قیمت فروش نهایی": Math.round(r.finalPrice),
      "مبلغ کمیسیون": Math.round(r.commissionAmount),
      "تاریخ محاسبه": new Date().toLocaleDateString("fa-IR"),
      "وضعیت": r.missingFields.length === 0 ? "کامل" : `ناقص: ${r.missingFields.join("، ")}`,
    }));
    downloadExcel(out, `قیمت‌گذاری-دیجی‌کالا-${Date.now()}.xlsx`);
    toast.success("فایل اکسل دانلود شد");
  };

  const pushToCatalog = () => {
    if (validRows.length === 0) {
      toast.error("ابتدا سطرهای ناقص را اصلاح کنید");
      return;
    }
    const items: CatalogItem[] = validRows.map((r) => ({
      id: r.id,
      name: r.name,
      purchaseOriginal: r.purchase,
      currency: r.currency,
      aedRateUsed: r.currency === "AED" ? aedRate : 0,
      purchase: r.purchaseToman,
      fixed: r.fixed, profit: r.profit, commission: r.commission,
      finalPrice: r.finalPrice, commissionAmount: r.commissionAmount,
      imageUrl: getAutoImageUrl(r.name),
      createdAt: Date.now(),
    }));
    onAddToCatalog(items);
    toast.success(`${items.length} محصول به لیست اضافه شد`);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-xl font-bold">بارگذاری انبوه از اکسل / CSV</h2>
            <p className="text-sm text-muted-foreground mt-1">
              ستون‌ها: نام محصول، قیمت خرید، ارز (تومان/درهم)، هزینه ثابت، سود، کمیسیون
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          <label
            className="cursor-pointer border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center gap-2"
          >
            <input
              ref={inputRef} type="file" hidden
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Upload className="h-6 w-6 text-primary" />
            <span className="font-semibold text-sm">
              {loading ? "در حال خواندن..." : "انتخاب فایل اکسل یا CSV"}
            </span>
            <span className="text-xs text-muted-foreground">.xlsx, .xls, .csv</span>
          </label>

          <button
            onClick={downloadTemplate}
            className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center gap-2"
          >
            <FileDown className="h-6 w-6 text-primary" />
            <span className="font-semibold text-sm">دانلود قالب نمونه</span>
            <span className="text-xs text-muted-foreground">شامل ستون ارز</span>
          </button>
        </div>
      </Card>

      {rows.length > 0 && (
        <>
          <div className="grid sm:grid-cols-4 gap-3">
            <Stat label="کل سطرها" value={rows.length} tone="muted" />
            <Stat label="کامل" value={validRows.length} tone="success" />
            <Stat label="ناقص" value={incompleteCount} tone="destructive" />
            <Stat label="درهمی" value={aedCount} tone="muted" />
          </div>

          {incompleteCount > 0 && (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {incompleteCount} سطر دارای داده ناقص است.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={pushToCatalog} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              افزودن به لیست کالاها ({validRows.length})
            </Button>
            {aedCount > 0 && (
              <Button onClick={recalcCurrent} size="lg" variant="outline" className="gap-2">
                محاسبه مجدد با نرخ فعلی
              </Button>
            )}
            <Button onClick={exportCalculated} size="lg" variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              دانلود اکسل
            </Button>
            <Button onClick={() => setRows([])} size="lg" variant="ghost">
              پاک‌کردن جدول
            </Button>
          </div>

          <Card className="overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-secondary-foreground">
                  <tr>
                    <Th>وضعیت</Th>
                    <Th>تصویر</Th>
                    <Th>نام محصول</Th>
                    <Th>قیمت خرید</Th>
                    <Th>ارز</Th>
                    <Th>خرید (تومان)</Th>
                    <Th>هزینه ثابت</Th>
                    <Th>سود</Th>
                    <Th>کمیسیون</Th>
                    <Th highlight>قیمت فروش</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const bad = r.missingFields.length > 0;
                    return (
                      <tr
                        key={r.id}
                        className={`border-t ${bad ? "bg-destructive/5" : ""}`}
                      >
                        <Td>
                          {bad ? (
                            <span title={r.missingFields.join("، ")}
                              className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
                              <AlertTriangle className="h-3.5 w-3.5" /> ناقص
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" /> کامل
                            </span>
                          )}
                        </Td>
                        <Td><Thumb name={r.name} /></Td>
                        <Td><span className="font-medium">{r.name || <em className="text-muted-foreground">—</em>}</span></Td>
                        <Td>{formatToman(r.purchase)}</Td>
                        <Td>
                          <Badge variant={r.currency === "AED" ? "default" : "secondary"} className="text-[10px]">
                            {r.currency === "AED" ? "درهم" : "تومان"}
                          </Badge>
                        </Td>
                        <Td>{formatToman(r.purchaseToman)}</Td>
                        <Td>{formatToman(r.fixed)}</Td>
                        <Td>{formatToman(r.profit)}</Td>
                        <Td>{formatToman(r.commission)}٪</Td>
                        <Td highlight>{formatToman(r.finalPrice)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Th({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <th className={`text-right px-3 py-3 font-semibold text-xs ${highlight ? "text-primary" : ""}`}>
      {children}
    </th>
  );
}
function Td({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <td className={`px-3 py-2.5 whitespace-nowrap tabular-nums ${highlight ? "font-bold text-primary" : ""}`}>
      {children}
    </td>
  );
}
function Stat({ label, value, tone }: { label: string; value: number; tone: "success" | "destructive" | "muted" }) {
  const c =
    tone === "success" ? "text-success bg-success/10"
    : tone === "destructive" ? "text-destructive bg-destructive/10"
    : "text-foreground bg-muted";
  return (
    <Card className="p-4 flex items-center justify-between" style={{ boxShadow: "var(--shadow-card)" }}>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-extrabold tabular-nums mt-1">{formatToman(value)}</p>
      </div>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${c}`}>
        <FileSpreadsheet className="h-5 w-5" />
      </div>
    </Card>
  );
}

function Thumb({ name }: { name: string }) {
  const [err, setErr] = useState(false);
  if (!name || err) {
    return (
      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
      </div>
    );
  }
  return (
    <img
      src={getAutoImageUrl(name)} alt={name} loading="lazy"
      onError={() => setErr(true)}
      className="h-10 w-10 rounded-md object-cover bg-muted"
    />
  );
}
