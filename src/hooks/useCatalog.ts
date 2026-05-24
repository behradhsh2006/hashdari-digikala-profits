import { useEffect, useState } from "react";
import { calcPricing } from "@/lib/pricing";

export type Currency = "TOMAN" | "AED";

export type CatalogItem = {
  id: string;
  name: string;
  /** Purchase price in the original currency (as entered) */
  purchaseOriginal: number;
  currency: Currency;
  /** AED rate (Tomans per 1 AED) used at last calculation. 0 if Toman. */
  aedRateUsed: number;
  /** Purchase price converted to Tomans (used in formula) */
  purchase: number;
  fixed: number;
  profit: number;
  commission: number;
  finalPrice: number;
  commissionAmount: number;
  imageUrl: string;
  customImage?: string;
  createdAt: number;
};

const KEY = "digikala-catalog-v3";

export function useCatalog() {
  const [items, setItems] = useState<CatalogItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: CatalogItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  return {
    items,
    add: (item: CatalogItem) => persist([item, ...items].slice(0, 300)),
    addMany: (newItems: CatalogItem[]) => persist([...newItems, ...items].slice(0, 300)),
    update: (id: string, patch: Partial<CatalogItem>) =>
      persist(items.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    remove: (id: string) => persist(items.filter((i) => i.id !== id)),
    clear: () => persist([]),
    /** Re-run pricing for all AED items using the current rate */
    recalcWithRate: (rate: number) => {
      if (!rate || rate <= 0) return 0;
      let changed = 0;
      const next = items.map((i) => {
        if (i.currency !== "AED") return i;
        const purchase = i.purchaseOriginal * rate;
        const { finalPrice, commissionAmount } = calcPricing(
          purchase, i.fixed, i.profit, i.commission,
        );
        changed++;
        return { ...i, purchase, aedRateUsed: rate, finalPrice, commissionAmount };
      });
      persist(next);
      return changed;
    },
  };
}
