import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductRow,
} from "@/lib/products.functions";

export type DbProduct = ProductRow;

/**
 * Persistent, DB-backed products store. All reads and writes go through
 * Supabase via TanStack server functions — survives refresh, redeploy,
 * and Cloudflare worker restarts.
 */
export function useProductsDb() {
  const list = useServerFn(listProducts);
  const create = useServerFn(createProduct);
  const update = useServerFn(updateProduct);
  const remove = useServerFn(deleteProduct);

  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { products } = await list();
      setProducts(products);
    } catch (e: any) {
      toast.error(e?.message ?? "خطا در دریافت محصولات");
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    products,
    loading,
    refresh,
    addProduct: async (input: Parameters<typeof create>[0]["data"]) => {
      const { product } = await create({ data: input });
      setProducts((prev) => [product, ...prev]);
      return product;
    },
    updateProduct: async (id: string, patch: Partial<DbProduct>) => {
      const { product } = await update({ data: { id, patch: patch as any } });
      setProducts((prev) => prev.map((p) => (p.id === id ? product : p)));
      return product;
    },
    removeProduct: async (id: string) => {
      await remove({ data: { id } });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    },
    stockCount: (id: string) => products.find((p) => p.id === id)?.stock ?? 0,
  };
}
