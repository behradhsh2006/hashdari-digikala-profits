import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Camera, Download, Image as ImageIcon, Package, Trash2 } from "lucide-react";
import { formatToman } from "@/lib/format";
import { downloadExcel } from "@/lib/excel";
import type { CatalogItem } from "@/hooks/useCatalog";

type Props = {
  items: CatalogItem[];
  onUpdate: (id: string, patch: Partial<CatalogItem>) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

export function ProductList({ items, onUpdate, onRemove, onClear }: Props) {
  const exportList = () => {
    if (items.length === 0) return;
    const out = items.map((p) => ({
      "نام محصول": p.name,
      "قیمت خرید": p.purchaseOriginal,
      "ارز": p.currency === "AED" ? "درهم" : "تومان",
      "نرخ درهم": p.currency === "AED" ? p.aedRateUsed : "",
      "قیمت خرید (تومان)": p.purchase,
      "هزینه ثابت": p.fixed,
      "سود خالص": p.profit,
      "کمیسیون (٪)": p.commission,
      "قیمت فروش نهایی": p.finalPrice,
      "مبلغ کمیسیون": p.commissionAmount,
      "تاریخ": new Date(p.createdAt).toLocaleDateString("fa-IR"),
    }));
    downloadExcel(out, `لیست-کالاها-${Date.now()}.xlsx`);
    toast.success("اکسل به‌روز دانلود شد");
  };

  if (items.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground border-dashed">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-semibold">لیست کالاها خالی است</p>
        <p className="text-xs mt-1">از تب «انبوه» اکسل بارگذاری کنید یا از «تک‌محصول» کالا اضافه کنید.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">{items.length} محصول در لیست</p>
        <div className="flex gap-2">
          <Button onClick={exportList} size="sm" className="gap-2">
            <Download className="h-4 w-4" /> دانلود اکسل به‌روز
          </Button>
          <Button onClick={onClear} variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <Trash2 className="h-4 w-4" /> پاک‌کردن همه
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <ProductCard key={p.id} item={p} onUpdate={onUpdate} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({
  item, onUpdate, onRemove,
}: { item: CatalogItem; onUpdate: Props["onUpdate"]; onRemove: Props["onRemove"] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [imgErr, setImgErr] = useState(false);

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      onUpdate(item.id, { customImage: dataUrl, imageUrl: dataUrl });
      toast.success("تصویر به‌روزرسانی شد");
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="overflow-hidden flex flex-col" style={{ boxShadow: "var(--shadow-card)" }}>
      <div
        className="relative aspect-square bg-muted cursor-pointer group"
        onClick={() => fileRef.current?.click()}
        title="کلیک برای آپلود تصویر"
      >
        {imgErr || !item.imageUrl ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:opacity-90 transition"
            onError={() => setImgErr(true)}
          />
        )}

        <input ref={fileRef} type="file" accept="image/*" hidden
          onChange={(e) => handleFile(e.target.files?.[0])} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
          onChange={(e) => handleFile(e.target.files?.[0])} />

        <div className="absolute top-2 right-2">
          <Badge variant={item.currency === "AED" ? "default" : "secondary"} className="text-[10px]">
            {item.currency === "AED" ? "درهم" : "تومان"}
          </Badge>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-background/95 backdrop-blur shadow flex items-center justify-center hover:bg-background"
          title="دوربین"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>

        {item.customImage && (
          <span className="absolute top-2 left-2 text-[10px] bg-background/90 text-foreground px-2 py-0.5 rounded-full">
            اختصاصی
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold truncate" title={item.name}>{item.name}</h3>

        <div className="mt-2 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">قیمت خرید اصلی</span>
            <span className="tabular-nums font-medium">
              {formatToman(item.purchaseOriginal)}{" "}
              <span className="text-[10px] text-muted-foreground">
                {item.currency === "AED" ? "درهم" : "ت"}
              </span>
            </span>
          </div>
          {item.currency === "AED" && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>نرخ درهم استفاده‌شده</span>
              <span className="tabular-nums">{formatToman(item.aedRateUsed)} ت</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">کمیسیون</span>
            <span className="tabular-nums">{formatToman(item.commission)}٪</span>
          </div>
        </div>

        <div className="rounded-lg bg-secondary p-3 mt-3">
          <p className="text-[11px] text-muted-foreground">قیمت فروش نهایی</p>
          <p className="text-lg font-extrabold text-primary tabular-nums">
            {formatToman(item.finalPrice)}{" "}
            <span className="text-[10px] font-normal text-muted-foreground">تومان</span>
          </p>
        </div>

        <Button
          variant="ghost" size="sm" onClick={() => onRemove(item.id)}
          className="mt-3 text-muted-foreground justify-center gap-1"
        >
          <Trash2 className="h-3.5 w-3.5" /> حذف
        </Button>
      </div>
    </Card>
  );
}
