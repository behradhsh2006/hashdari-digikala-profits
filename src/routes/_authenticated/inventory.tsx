import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Download, Pencil, AlertTriangle, Package, Upload, Loader2 } from "lucide-react";
import { useProductsDb, type DbProduct } from "@/hooks/useProductsDb";
import { useAedRate } from "@/hooks/useAedRate";
import { useAuth } from "@/hooks/useAuth";
import { formatToman, parseNumber } from "@/lib/format";
import { downloadExcel } from "@/lib/excel";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";
import { bulkPushPrices } from "@/lib/digikalaApi";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [{ title: "محصولات — سرفیس استور" }] }),
  component: InventoryPage,
});

function InventoryPage() {
  return (
    <PermissionGate perm="view_inventory">
      <Inner />
    </PermissionGate>
  );
}

const SHIPPING_LABELS: Record<string, string> = {
  pending: "در انتظار ارسال",
  processing: "در حال آماده‌سازی",
  shipped: "ارسال شد",
  delivered: "تحویل شد",
  returned: "مرجوعی",
};

function Inner() {
  const inv = useProductsDb();
  const { rate } = useAedRate();
  const { can } = useAuth();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<DbProduct | null>(null);
  const [pushing, setPushing] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = inv.products.filter((p) =>
    [p.name, p.brand, p.model, p.sku].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  const exportXlsx = () => {
    if (filtered.length === 0) return toast.error("هیچ محصولی برای خروجی وجود ندارد");
    const out = filtered.map((p) => ({
      "نام": p.name,
      "توضیحات": p.description ?? "",
      "برند": p.brand ?? "",
      "مدل": p.model ?? "",
      "SKU": p.sku ?? "",
      "CPU": p.cpu ?? "",
      "RAM": p.ram ?? "",
      "Storage": p.storage ?? "",
      "رنگ": p.color ?? "",
      "قیمت خرید": p.cost_original,
      "ارز": p.currency === "AED" ? "درهم" : "تومان",
      "قیمت خرید (تومان)": p.currency === "AED" ? p.cost_original * rate : p.cost_original,
      "قیمت پایه فروش": p.base_price,
      "حداقل موجودی": p.reorder_threshold,
      "موجودی فعلی": p.stock,
      "وضعیت ارسال": SHIPPING_LABELS[p.shipping_status] ?? p.shipping_status,
    }));
    downloadExcel(out, `محصولات-${Date.now()}.xlsx`);
    toast.success("اکسل دانلود شد");
  };

  const pushPrices = async () => {
    const items = filtered
      .filter((p) => p.sku && p.base_price > 0)
      .map((p) => ({ variantId: p.sku!, priceToman: p.base_price, stock: p.stock }));
    if (items.length === 0) return toast.error("محصول قابل ارسال یافت نشد (SKU/قیمت لازم است)");
    setPushing(true);
    try {
      const res = await bulkPushPrices(items);
      const ok = res.filter((r) => r.ok).length;
      const fail = res.length - ok;
      if (fail === 0) toast.success(`${ok} قیمت با موفقیت به دیجی‌کالا ارسال شد`);
      else toast.warning(`${ok} موفق، ${fail} ناموفق — کلیدها و SKU را بررسی کنید`);
    } catch (e: any) {
      toast.error(e?.message ?? "خطا در ارسال قیمت‌ها");
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="جستجو در نام، برند، مدل، SKU..." value={q} onChange={(e) => setQ(e.target.value)}
          className="h-10 max-w-sm" />
        <div className="flex-1" />
        {inv.loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {can("export_data") && (
          <Button variant="outline" onClick={exportXlsx} className="gap-2">
            <Download className="h-4 w-4" /> دانلود اکسل
          </Button>
        )}
        {can("edit_inventory") && (
          <Button variant="outline" onClick={pushPrices} disabled={pushing} className="gap-2">
            {pushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            ارسال قیمت‌ها به دیجی‌کالا
          </Button>
        )}
        {can("edit_inventory") && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEdit(null); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => setEdit(null)}>
                <Plus className="h-4 w-4" /> افزودن محصول
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{edit ? "ویرایش محصول" : "افزودن محصول جدید"}</DialogTitle>
              </DialogHeader>
              <ProductForm
                initial={edit ?? undefined}
                busy={saving}
                onSubmit={async (p) => {
                  setSaving(true);
                  try {
                    if (edit) { await inv.updateProduct(edit.id, p); toast.success("به‌روزرسانی شد"); }
                    else { await inv.addProduct(p); toast.success("محصول در دیتابیس ذخیره شد"); }
                    setOpen(false); setEdit(null);
                  } catch (e: any) {
                    toast.error(e?.message ?? "خطا در ذخیره");
                  } finally {
                    setSaving(false);
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="font-semibold">{inv.loading ? "در حال بارگذاری..." : "محصولی یافت نشد"}</p>
          {!inv.loading && (
            <p className="text-sm text-muted-foreground mt-1">با کلیک روی «افزودن محصول» شروع کنید.</p>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground">
                <tr>
                  <Th>نام / برند / مدل</Th>
                  <Th>مشخصات</Th>
                  <Th>SKU</Th>
                  {can("view_financials") && <Th>قیمت خرید</Th>}
                  <Th>قیمت پایه فروش</Th>
                  <Th>موجودی</Th>
                  <Th>وضعیت ارسال</Th>
                  {can("edit_inventory") && <Th>عملیات</Th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const stock = p.stock;
                  const low = stock <= p.reorder_threshold;
                  return (
                    <tr key={p.id} className="border-t">
                      <Td>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.brand} {p.model && `• ${p.model}`}</div>
                      </Td>
                      <Td>
                        <div className="text-xs space-y-0.5">
                          {p.cpu && <div>CPU: {p.cpu}</div>}
                          {p.ram && <div>RAM: {p.ram}</div>}
                          {p.storage && <div>SSD: {p.storage}</div>}
                          {p.color && <div>رنگ: {p.color}</div>}
                        </div>
                      </Td>
                      <Td><code className="text-xs">{p.sku}</code></Td>
                      {can("view_financials") && (
                        <Td>
                          <div className="tabular-nums">{formatToman(p.cost_original)}</div>
                          <Badge variant={p.currency === "AED" ? "default" : "secondary"} className="text-[10px] mt-1">
                            {p.currency === "AED" ? "درهم" : "تومان"}
                          </Badge>
                        </Td>
                      )}
                      <Td><span className="tabular-nums font-semibold">{formatToman(p.base_price)}</span></Td>
                      <Td>
                        <span className={`inline-flex items-center gap-1 font-bold tabular-nums ${low ? "text-destructive" : "text-success"}`}>
                          {low && <AlertTriangle className="h-3.5 w-3.5" />}
                          {stock}
                        </span>
                        <div className="text-[10px] text-muted-foreground">حداقل: {p.reorder_threshold}</div>
                      </Td>
                      <Td>
                        <Badge variant="outline" className="text-[10px]">
                          {SHIPPING_LABELS[p.shipping_status] ?? p.shipping_status}
                        </Badge>
                      </Td>
                      {can("edit_inventory") && (
                        <Td>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEdit(p); setOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive"
                              onClick={async () => {
                                if (!confirm(`حذف ${p.name}؟`)) return;
                                try { await inv.removeProduct(p.id); toast.success("از دیتابیس حذف شد"); }
                                catch (e: any) { toast.error(e?.message ?? "خطا در حذف"); }
                              }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </Td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-right px-3 py-3 font-semibold text-xs whitespace-nowrap">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-3 whitespace-nowrap align-top">{children}</td>;
}

type FormPayload = {
  name: string;
  description?: string | null;
  brand?: string | null;
  model?: string | null;
  sku?: string | null;
  cpu?: string | null;
  ram?: string | null;
  storage?: string | null;
  color?: string | null;
  currency: "TOMAN" | "AED";
  cost_original: number;
  base_price: number;
  stock: number;
  reorder_threshold: number;
  shipping_status: string;
};

function ProductForm({
  initial, busy, onSubmit,
}: { initial?: DbProduct; busy?: boolean; onSubmit: (p: FormPayload) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "Microsoft");
  const [model, setModel] = useState(initial?.model ?? "");
  const [cpu, setCpu] = useState(initial?.cpu ?? "");
  const [ram, setRam] = useState(initial?.ram ?? "");
  const [storage, setStorage] = useState(initial?.storage ?? "");
  const [color, setColor] = useState(initial?.color ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [costPrice, setCostPrice] = useState<number>(initial?.cost_original ?? 0);
  const [currency, setCurrency] = useState<"TOMAN" | "AED">((initial?.currency as any) ?? "TOMAN");
  const [basePrice, setBasePrice] = useState<number>(initial?.base_price ?? 0);
  const [stock, setStock] = useState<number>(initial?.stock ?? 0);
  const [reorder, setReorder] = useState<number>(initial?.reorder_threshold ?? 2);
  const [shipping, setShipping] = useState<string>(initial?.shipping_status ?? "pending");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("نام الزامی است");
    if (currency === "AED" && costPrice > 1000) return toast.error("سقف ورودی درهم: ۱۰۰۰");
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      brand: brand.trim() || null,
      model: model.trim() || null,
      sku: sku.trim() || null,
      cpu: cpu || null, ram: ram || null, storage: storage || null, color: color || null,
      currency, cost_original: costPrice, base_price: basePrice,
      stock, reorder_threshold: reorder, shipping_status: shipping,
    });
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>
  );

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
      <Field label="نام محصول *"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً Surface Pro 11" /></Field>
      <Field label="SKU"><Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SP11-256-BLK" /></Field>
      <div className="sm:col-span-2">
        <Field label="توضیحات">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="توضیح کوتاه محصول..." />
        </Field>
      </div>
      <Field label="برند"><Input value={brand} onChange={(e) => setBrand(e.target.value)} /></Field>
      <Field label="مدل"><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Pro 11 / Laptop 7" /></Field>
      <Field label="CPU"><Input value={cpu} onChange={(e) => setCpu(e.target.value)} placeholder="Snapdragon X Elite" /></Field>
      <Field label="RAM"><Input value={ram} onChange={(e) => setRam(e.target.value)} placeholder="16GB" /></Field>
      <Field label="Storage"><Input value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="512GB SSD" /></Field>
      <Field label="رنگ"><Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Platinum" /></Field>

      <Field label="ارز">
        <div className="grid grid-cols-2 gap-2 h-10">
          {(["TOMAN", "AED"] as const).map((c) => (
            <button key={c} type="button" onClick={() => setCurrency(c)}
              className={`rounded-md border text-sm font-medium ${currency === c ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>
              {c === "TOMAN" ? "تومان" : "درهم"}
            </button>
          ))}
        </div>
      </Field>
      <Field label={currency === "AED" ? "قیمت خرید (حداکثر ۱۰۰۰ درهم)" : "قیمت خرید (تومان)"}>
        <Input dir="ltr" inputMode="decimal" value={costPrice ? formatToman(costPrice) : ""}
          onChange={(e) => setCostPrice(parseNumber(e.target.value))} className="text-left" />
      </Field>
      <Field label="قیمت پایه فروش (تومان)">
        <Input dir="ltr" inputMode="decimal" value={basePrice ? formatToman(basePrice) : ""}
          onChange={(e) => setBasePrice(parseNumber(e.target.value))} className="text-left" />
      </Field>
      <Field label="موجودی فعلی">
        <Input dir="ltr" inputMode="numeric" value={String(stock)}
          onChange={(e) => setStock(parseNumber(e.target.value))} className="text-left" />
      </Field>
      <Field label="حداقل موجودی (هشدار)">
        <Input dir="ltr" inputMode="numeric" value={String(reorder)}
          onChange={(e) => setReorder(parseNumber(e.target.value))} className="text-left" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="وضعیت ارسال">
          <div className="flex flex-wrap gap-2">
            {Object.entries(SHIPPING_LABELS).map(([k, v]) => (
              <button key={k} type="button" onClick={() => setShipping(k)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium ${shipping === k ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>
                {v}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="sm:col-span-2 flex justify-end pt-2">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "ذخیره در دیتابیس"}
        </Button>
      </div>
    </form>
  );
}
