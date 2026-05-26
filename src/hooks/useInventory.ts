import { useEffect, useState } from "react";
import type { Currency } from "@/hooks/useCatalog";

export type SerialStatus = "in_stock" | "sold" | "reserved" | "warranty";

export const SERIAL_STATUS_LABELS: Record<SerialStatus, string> = {
  in_stock: "موجود در انبار",
  sold: "فروخته شده",
  reserved: "رزرو شده",
  warranty: "در گارانتی",
};

export type Product = {
  id: string;
  name: string;            // e.g. "Surface Pro 11"
  brand: string;           // e.g. "Microsoft"
  model: string;           // e.g. "Pro 11"
  cpu?: string;
  ram?: string;
  storage?: string;
  color?: string;
  sku: string;
  costPrice: number;       // original currency amount
  currency: Currency;      // TOMAN | AED
  basePrice: number;       // base selling price (Toman)
  reorderThreshold: number;
  createdAt: number;
};

export type Serial = {
  id: string;
  productId: string;
  serial: string;
  status: SerialStatus;
  warehouse: string;
  arrivedAt: number;
  notes?: string;
};

const PKEY = "inv-products-v1";
const SKEY = "inv-serials-v1";

function load<T>(k: string): T[] {
  try { const r = localStorage.getItem(k); if (r) return JSON.parse(r); } catch {}
  return [];
}
function save<T>(k: string, v: T[]) { localStorage.setItem(k, JSON.stringify(v)); }

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [serials, setSerials] = useState<Serial[]>([]);

  useEffect(() => {
    setProducts(load<Product>(PKEY));
    setSerials(load<Serial>(SKEY));
  }, []);

  const persistP = (n: Product[]) => { setProducts(n); save(PKEY, n); };
  const persistS = (n: Serial[]) => { setSerials(n); save(SKEY, n); };

  return {
    products, serials,
    addProduct: (p: Product) => persistP([p, ...products]),
    addProducts: (list: Product[]) => persistP([...list, ...products]),
    updateProduct: (id: string, patch: Partial<Product>) =>
      persistP(products.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    removeProduct: (id: string) => {
      persistP(products.filter((p) => p.id !== id));
      persistS(serials.filter((s) => s.productId !== id));
    },
    clearProducts: () => { persistP([]); persistS([]); },

    addSerial: (s: Serial) => persistS([s, ...serials]),
    addSerials: (list: Serial[]) => persistS([...list, ...serials]),
    updateSerial: (id: string, patch: Partial<Serial>) =>
      persistS(serials.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    removeSerial: (id: string) => persistS(serials.filter((s) => s.id !== id)),

    /** Counts of serials per product and status */
    stockCount: (productId: string, status: SerialStatus = "in_stock") =>
      serials.filter((s) => s.productId === productId && s.status === status).length,

    /** Recalculates Toman cost for AED products using a new rate (returns count updated) */
    recalcWithRate: (rate: number) => {
      if (!rate || rate <= 0) return 0;
      let n = 0;
      const next = products.map((p) => {
        if (p.currency !== "AED") return p;
        n++;
        return { ...p }; // costPrice stays in original AED; conversion is on display
      });
      persistP(next);
      return n;
    },
  };
}
