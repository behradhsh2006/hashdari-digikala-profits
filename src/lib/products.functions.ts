import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProductInput = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(4000).optional().nullable(),
  brand: z.string().max(255).optional().nullable(),
  model: z.string().max(255).optional().nullable(),
  sku: z.string().max(255).optional().nullable(),
  cpu: z.string().max(255).optional().nullable(),
  ram: z.string().max(255).optional().nullable(),
  storage: z.string().max(255).optional().nullable(),
  color: z.string().max(255).optional().nullable(),
  currency: z.enum(["TOMAN", "AED"]).default("TOMAN"),
  cost_original: z.number().finite().min(0).default(0),
  base_price: z.number().finite().min(0).default(0),
  fixed_costs: z.number().finite().min(0).default(0),
  profit_percent: z.number().finite().min(0).max(1000).default(20),
  commission_percent: z.number().finite().min(0).max(100).default(10),
  stock: z.number().int().min(0).default(0),
  reorder_threshold: z.number().int().min(0).default(2),
  shipping_status: z.string().max(64).default("pending"),
  image_url: z.string().max(2048).optional().nullable(),
  digikala_dkp: z.string().max(255).optional().nullable(),
});

export type ProductRow = z.infer<typeof ProductInput> & {
  id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { products: (data ?? []) as ProductRow[] };
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProductInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("products")
      .insert({ ...data, owner_id: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { product: row as ProductRow };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), patch: ProductInput.partial() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("products")
      .update(data.patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { product: row as ProductRow };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
