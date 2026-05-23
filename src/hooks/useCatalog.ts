import { useEffect, useState } from "react";

export type CatalogItem = {
  id: string;
  name: string;
  purchase: number;
  fixed: number;
  profit: number;
  commission: number;
  finalPrice: number;
  commissionAmount: number;
  imageUrl: string;          // resolved image (auto or custom)
  customImage?: string;      // data URL if user uploaded
  createdAt: number;
};

const KEY = "digikala-catalog-v2";

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
    add: (item: CatalogItem) => persist([item, ...items].slice(0, 200)),
    addMany: (newItems: CatalogItem[]) => persist([...newItems, ...items].slice(0, 200)),
    update: (id: string, patch: Partial<CatalogItem>) =>
      persist(items.map((i) => (i.id === id ? { ...i, ...patch } : i))),
    remove: (id: string) => persist(items.filter((i) => i.id !== id)),
    clear: () => persist([]),
  };
}
