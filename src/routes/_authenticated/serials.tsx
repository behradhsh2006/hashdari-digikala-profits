import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Barcode } from "lucide-react";
import { useInventory, type Serial, type SerialStatus, SERIAL_STATUS_LABELS } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import { toJalaliShort } from "@/lib/jalali";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";

export const Route = createFileRoute("/_authenticated/serials")({
  head: () => ({ meta: [{ title: "شماره سریال‌ها — سرفیس استور" }] }),
  component: SerialsPage,
});

function SerialsPage() {
  return (
    <PermissionGate perm="view_serials">
      <Inner />
    </PermissionGate>
  );
}

const STATUS_COLOR: Record<SerialStatus, string> = {
  in_stock: "bg-success/15 text-success",
  sold: "bg-muted text-muted-foreground",
  reserved: "bg-accent text-accent-foreground",
  warranty: "bg-destructive/15 text-destructive",
};

function Inner() {
  const inv = useInventory();
  const { can } = useAuth();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SerialStatus>("all");
  const [open, setOpen] = useState(false);

  const list = inv.serials.filter((s) => {
    const product = inv.products.find((p) => p.id === s.productId);
    const text = [s.serial, s.warehouse, product?.name, product?.sku].join(" ").toLowerCase();
    const matches = text.includes(q.toLowerCase());
    const sm = statusFilter === "all" || s.status === statusFilter;
    return matches && sm;
  });

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="جستجو سریال، انبار، محصول..." value={q} onChange={(e) => setQ(e.target.value)}
          className="h-10 max-w-sm" />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="h-10 w-44"><SelectValue placeholder="وضعیت" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            {Object.entries(SERIAL_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        {can("edit_serials") && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> ثبت سریال جدید</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>ثبت شماره سریال جدید</DialogTitle></DialogHeader>
              <SerialForm
                products={inv.products}
                onSubmit={(s) => {
                  inv.addSerial({ ...s, id: crypto.randomUUID() });
                  setOpen(false);
                  toast.success("سریال ثبت شد");
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {list.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Barcode className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="font-semibold">سریالی ثبت نشده است</p>
          <p className="text-xs text-muted-foreground mt-1">ابتدا محصول اضافه کنید، سپس سریال ثبت نمایید.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground">
                <tr>
                  <th className="text-right px-3 py-3 text-xs font-semibold">شماره سریال</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold">محصول</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold">وضعیت</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold">انبار</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold">تاریخ ورود</th>
                  {can("edit_serials") && <th className="text-right px-3 py-3 text-xs font-semibold">عملیات</th>}
                </tr>
              </thead>
              <tbody>
                {list.map((s) => {
                  const p = inv.products.find((x) => x.id === s.productId);
                  return (
                    <tr key={s.id} className="border-t">
                      <td className="px-3 py-2.5"><code className="text-xs font-bold">{s.serial}</code></td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-xs">{p?.name ?? "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{p?.sku}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        {can("edit_serials") ? (
                          <Select value={s.status} onValueChange={(v) => inv.updateSerial(s.id, { status: v as SerialStatus })}>
                            <SelectTrigger className={`h-7 text-[11px] font-bold ${STATUS_COLOR[s.status]}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(SERIAL_STATUS_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={STATUS_COLOR[s.status]}>{SERIAL_STATUS_LABELS[s.status]}</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs">{s.warehouse}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums">{toJalaliShort(s.arrivedAt)}</td>
                      {can("edit_serials") && (
                        <td className="px-3 py-2.5">
                          <Button size="icon" variant="ghost" className="text-destructive"
                            onClick={() => { if (confirm("حذف سریال؟")) { inv.removeSerial(s.id); toast.success("حذف شد"); } }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
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

function SerialForm({ products, onSubmit }: {
  products: ReturnType<typeof useInventory>["products"];
  onSubmit: (s: Omit<Serial, "id">) => void;
}) {
  const [serial, setSerial] = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [status, setStatus] = useState<SerialStatus>("in_stock");
  const [warehouse, setWarehouse] = useState("انبار مرکزی");
  const [notes, setNotes] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial.trim()) return toast.error("شماره سریال الزامی است");
    if (!productId) return toast.error("ابتدا محصول را در صفحه محصولات اضافه کنید");
    onSubmit({ serial: serial.trim(), productId, status, warehouse, notes, arrivedAt: Date.now() });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">شماره سریال</Label>
        <Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="SN-XXXX-XXXX" dir="ltr" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">محصول</Label>
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger><SelectValue placeholder="انتخاب کنید" /></SelectTrigger>
          <SelectContent>
            {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">وضعیت</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as SerialStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(SERIAL_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">انبار</Label>
          <Input value={warehouse} onChange={(e) => setWarehouse(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">یادداشت (اختیاری)</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg">ثبت سریال</Button>
      </div>
    </form>
  );
}
