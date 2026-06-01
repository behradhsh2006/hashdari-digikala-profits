// Digikala Seller Open API client
// Reference: https://seller.digikala.com/open-api/v1/doc/
import { supabase } from "@/integrations/supabase/client";

const PROVIDER = "integrations";
const DEFAULT_BASE = "https://seller.digikala.com/api/v1";

export type DigikalaCreds = {
  sellerId: string;
  apiKey: string;
  token: string;
  baseUrl: string;
};

export async function loadDigikalaCreds(): Promise<DigikalaCreds> {
  const { data } = await supabase
    .from("api_credentials")
    .select("credential_key, credential_value")
    .eq("provider", PROVIDER);
  const out: DigikalaCreds = { sellerId: "", apiKey: "", token: "", baseUrl: DEFAULT_BASE };
  for (const r of data ?? []) {
    if (r.credential_key === "digikalaSellerId") out.sellerId = r.credential_value ?? "";
    if (r.credential_key === "digikalaApiKey") out.apiKey = r.credential_value ?? "";
    if (r.credential_key === "digikalaToken") out.token = r.credential_value ?? "";
    if (r.credential_key === "digikalaBaseUrl" && r.credential_value) out.baseUrl = r.credential_value;
  }
  return out;
}

/** Build headers per Digikala Open API spec. */
export function digikalaHeaders(c: DigikalaCreds): HeadersInit {
  return {
    Authorization: `Bearer ${c.token}`,
    "x-api-key": c.apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function digikalaFetch(path: string, init: RequestInit = {}, creds?: DigikalaCreds) {
  const c = creds ?? (await loadDigikalaCreds());
  if (!c.token || !c.apiKey) throw new Error("کلیدهای دیجی‌کالا در گاوصندوق تنظیم نشده است");
  const url = path.startsWith("http") ? path : `${c.baseUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...digikalaHeaders(c), ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Digikala API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

// ---------- Orders / Commitments ----------

export type DkOrder = {
  id: string | number;
  order_id?: string | number;
  variant_id?: string | number;
  product_title?: string;
  title_fa?: string;
  quantity?: number;
  price?: number;
  status?: string;
  state?: string;
  created_at?: string;
  shipment_deadline?: string;
  delivery_deadline?: string;
};

export type Commitment = {
  id: string;
  title: string;
  variantId: string;
  qty: number;
  price: number; // Rials as returned by Digikala
  status: string;
  deadline?: string;
  createdAt?: string;
};

const PROCESSING_RE = /process|packag|pending|prepar|در حال|آماده/i;

function normalizeOrder(o: any): Commitment {
  const items = o.items ?? o.order_items ?? [o];
  const first = items[0] ?? {};
  return {
    id: String(o.id ?? o.order_id ?? first.id ?? crypto.randomUUID()),
    title: first.product_title ?? first.title_fa ?? o.product_title ?? o.title_fa ?? "—",
    variantId: String(first.variant_id ?? o.variant_id ?? ""),
    qty: Number(first.quantity ?? o.quantity ?? 1),
    price: Number(first.price ?? o.price ?? 0),
    status: String(o.status ?? o.state ?? first.status ?? ""),
    deadline: o.shipment_deadline ?? o.delivery_deadline ?? first.shipment_deadline,
    createdAt: o.created_at ?? first.created_at,
  };
}

/** Fetch orders and bucket by today/yesterday for the Commitments page. */
export async function fetchCommitments(): Promise<{ today: Commitment[]; yesterday: Commitment[]; all: Commitment[] }> {
  // Digikala Open API: GET /orders (paginated). Accept multiple envelope shapes.
  const data = await digikalaFetch("/orders?status=processing,packaging&per_page=100");
  const list: any[] = data?.data?.orders ?? data?.data ?? data?.orders ?? (Array.isArray(data) ? data : []);
  const all = list.map(normalizeOrder).filter((o) => PROCESSING_RE.test(o.status) || !o.status);

  const todayKey = new Date().toDateString();
  const ydayKey = new Date(Date.now() - 86400000).toDateString();
  const today: Commitment[] = [];
  const yesterday: Commitment[] = [];
  for (const c of all) {
    const d = c.createdAt ? new Date(c.createdAt).toDateString() : todayKey;
    if (d === todayKey) today.push(c);
    else if (d === ydayKey) yesterday.push(c);
  }
  return { today, yesterday, all };
}

// ---------- Price / Inventory Sync ----------

/**
 * Push a single variant price to Digikala.
 * Digikala expects prices in Rials = Tomans * 10.
 */
export async function pushVariantPrice(opts: {
  variantId: string | number;
  priceToman: number;
  stock?: number;
}): Promise<any> {
  const priceRials = opts.priceToman * 10;
  const body: Record<string, any> = {
    variant_id: opts.variantId,
    price: priceRials,
  };
  if (typeof opts.stock === "number") body.stock = opts.stock;

  // Per Open API docs: PUT /variants/{id}/price
  return digikalaFetch(`/variants/${opts.variantId}/price`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function bulkPushPrices(items: { variantId: string | number; priceToman: number; stock?: number }[]) {
  const results: { variantId: string | number; ok: boolean; error?: string }[] = [];
  for (const it of items) {
    try {
      await pushVariantPrice(it);
      results.push({ variantId: it.variantId, ok: true });
    } catch (e: any) {
      results.push({ variantId: it.variantId, ok: false, error: e?.message ?? "خطا" });
    }
  }
  return results;
}
