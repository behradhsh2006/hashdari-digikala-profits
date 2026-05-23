import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon, RefreshCw, Trash2 } from "lucide-react";
import { getAutoImageUrl } from "@/lib/productImage";
import { formatToman } from "@/lib/format";
import type { CatalogItem } from "@/hooks/useCatalog";

type Props = {
  items: CatalogItem[];
  onUpdate: (id: string, patch: Partial<CatalogItem>) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

export function ProductCatalog({ items, onUpdate, onRemove, onClear }: Props) {
  if (items.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground border-dashed">
        <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
        هنوز محصولی ذخیره نشده است.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} محصول در کاتالوگ</p>
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1 text-muted-foreground">
          <Trash2 className="h-4 w-4" /> پاک‌کردن همه
        </Button>
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
  const [seed, setSeed] = useState(1);
  const [imgErr, setImgErr] = useState(false);

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      onUpdate(item.id, { customImage: dataUrl, imageUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const regenerate = () => {
    const next = seed + 1;
    setSeed(next);
    setImgErr(false);
    onUpdate(item.id, {
      customImage: undefined,
      imageUrl: getAutoImageUrl(item.name, next),
    });
  };

  const profit = item.finalPrice - item.commissionAmount - item.purchase - item.fixed;

  return (
    <Card className="overflow-hidden flex flex-col" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="relative aspect-square bg-muted">
        {imgErr || !item.imageUrl ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        )}
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          <input ref={fileRef} type="file" accept="image/*" hidden
            onChange={(e) => handleFile(e.target.files?.[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
            onChange={(e) => handleFile(e.target.files?.[0])} />
          <IconBtn title="آپلود تصویر" onClick={() => fileRef.current?.click()}>
            <ImageIcon className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn title="دوربین" onClick={() => cameraRef.current?.click()}>
            <Camera className="h-3.5 w-3.5" />
          </IconBtn>
          {!item.customImage && (
            <IconBtn title="تصویر جدید" onClick={regenerate}>
              <RefreshCw className="h-3.5 w-3.5" />
            </IconBtn>
          )}
        </div>
        {item.customImage && (
          <span className="absolute top-2 right-2 text-[10px] bg-background/90 text-foreground px-2 py-0.5 rounded-full">
            تصویر اختصاصی
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold truncate">{item.name}</h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          {new Date(item.createdAt).toLocaleDateString("fa-IR")}
        </p>

        <div className="rounded-lg bg-secondary p-3 mb-3">
          <p className="text-[11px] text-muted-foreground">قیمت فروش نهایی</p>
          <p className="text-lg font-extrabold text-primary tabular-nums">
            {formatToman(item.finalPrice)}{" "}
            <span className="text-[10px] font-normal text-muted-foreground">تومان</span>
          </p>
        </div>

        <dl className="text-xs space-y-1 mt-auto">
          <Row k="کمیسیون" v={item.commissionAmount} suffix={`(${formatToman(item.commission)}٪)`} />
          <Row k="هزینه‌ها" v={item.purchase + item.fixed} />
          <Row k="سود خالص" v={profit} tone="success" />
        </dl>

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

function IconBtn({
  children, onClick, title,
}: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      title={title} onClick={onClick}
      className="h-8 w-8 rounded-full bg-background/95 backdrop-blur shadow flex items-center justify-center hover:bg-background transition-colors"
    >
      {children}
    </button>
  );
}

function Row({
  k, v, suffix, tone,
}: { k: string; v: number; suffix?: string; tone?: "success" }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={`tabular-nums font-medium ${tone === "success" ? "text-success" : ""}`}>
        {formatToman(v)} <span className="text-[10px] text-muted-foreground">ت</span>
        {suffix && <span className="text-[10px] text-muted-foreground mr-1">{suffix}</span>}
      </dd>
    </div>
  );
}
