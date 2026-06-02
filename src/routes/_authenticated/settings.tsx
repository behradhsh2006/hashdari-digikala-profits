import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { KeyRound, Globe, Loader2, ShieldCheck, PackageSearch, CheckCircle2, XCircle, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";
import { supabase } from "@/integrations/supabase/client";
import { decryptDigikalaToken } from "@/lib/rsaDecrypt";
import { useOrdersConfig, testOrdersConnection } from "@/hooks/useOrdersApi";

const PROVIDER = "integrations";

type Integrations = {
  digikalaSellerId: string;
  digikalaApiKey: string;
  digikalaToken: string;
  externalApiUrl: string;
  externalApiToken: string;
};

const FIELDS: { key: keyof Integrations; label: string; type?: string }[] = [
  { key: "digikalaSellerId", label: "Seller ID" },
  { key: "digikalaApiKey", label: "API Key", type: "password" },
  { key: "digikalaToken", label: "Token", type: "password" },
  { key: "externalApiUrl", label: "External API URL" },
  { key: "externalApiToken", label: "External API Token", type: "password" },
];

const DEFAULT: Integrations = {
  digikalaSellerId: "", digikalaApiKey: "", digikalaToken: "",
  externalApiUrl: "", externalApiToken: "",
};

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "تنظیمات و API — سرفیس استور" }] }),
  component: () => <PermissionGate perm="manage_settings"><Inner /></PermissionGate>,
});

function Inner() {
  const [data, setData] = useState<Integrations>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // One-time cleanup: remove any legacy plaintext credentials from localStorage
    try { localStorage.removeItem("app-integrations-v1"); } catch {}

    (async () => {
      const { data: rows, error } = await supabase
        .from("api_credentials")
        .select("credential_key, credential_value")
        .eq("provider", PROVIDER);
      if (error) {
        // Vault is admin-only; non-admins get an empty/forbidden response — that's fine.
        setLoading(false);
        return;
      }
      const next = { ...DEFAULT };
      for (const r of rows ?? []) {
        if (r.credential_key in next) {
          (next as any)[r.credential_key] = r.credential_value ?? "";
        }
      }
      setData(next);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      // Upsert each credential row. Vault RLS (super_admin only) protects the data.
      const payload = FIELDS.map((f) => ({
        provider: PROVIDER,
        credential_key: f.key,
        label: f.label,
        credential_value: data[f.key] ?? "",
      }));
      // Delete + insert to avoid composite-key upsert complexity
      const { error: delErr } = await supabase
        .from("api_credentials")
        .delete()
        .eq("provider", PROVIDER);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase
        .from("api_credentials")
        .insert(payload);
      if (insErr) throw insErr;
      toast.success("تنظیمات در گاوصندوق امن ذخیره شد");
    } catch (e: any) {
      toast.error(e?.message ?? "ذخیره ناموفق بود (نیاز به سطح دسترسی مدیر ارشد)");
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof Integrations) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((d) => ({ ...d, [k]: e.target.value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin ml-2" /> در حال بارگذاری از گاوصندوق...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-5 text-sm border-success/30 bg-success/5 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-success mt-0.5" />
        <div>
          <p className="font-bold">گاوصندوق امن کلیدها</p>
          <p className="text-muted-foreground mt-1">
            کلیدها در جدول رمزنگاری‌شدهٔ <code>api_credentials</code> ذخیره شده و فقط برای «مدیر ارشد» قابل خواندن و ویرایش هستند. هیچ مقداری در LocalStorage مرورگر باقی نمی‌ماند.
          </p>
        </div>
      </Card>

      <Card className="p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="font-bold">API فروشنده دیجی‌کالا</h2>
        </div>
        <div className="space-y-3">
          <Field label="Seller ID" value={data.digikalaSellerId} onChange={set("digikalaSellerId")} />
          <Field label="API Key" value={data.digikalaApiKey} onChange={set("digikalaApiKey")} type="password" />
          <Field label="Token" value={data.digikalaToken} onChange={set("digikalaToken")} type="password" />
        </div>
      </Card>

      <DigikalaOAuthCard
        currentToken={data.digikalaToken}
        onTokenDecrypted={(tok) => {
          setData((d) => ({ ...d, digikalaToken: tok }));
        }}
      />

      <Card className="p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="font-bold">یکپارچه‌سازی نرم‌افزار خارجی</h2>
        </div>
        <div className="space-y-3">
          <Field label="آدرس Endpoint" value={data.externalApiUrl} onChange={set("externalApiUrl")} placeholder="https://api.example.com/products" />
          <Field label="Token" value={data.externalApiToken} onChange={set("externalApiToken")} type="password" />
        </div>
      </Card>

      <OrdersApiCard />


      <div className="flex justify-end">
        <Button onClick={save} size="lg" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ذخیره در گاوصندوق"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={onChange} type={type} dir="ltr" className="text-left" placeholder={placeholder} autoComplete="off" />
    </div>
  );
}

function OrdersApiCard() {
  const { cfg, save, loading } = useOrdersConfig();
  const [baseUrl, setBaseUrl] = useState("");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    setBaseUrl(cfg.baseUrl);
    setToken(cfg.token);
  }, [cfg.baseUrl, cfg.token]);

  const onSave = async () => {
    setSaving(true);
    try {
      await save({ baseUrl, token });
      toast.success("تنظیمات سفارش‌ها ذخیره شد");
    } catch (e: any) {
      toast.error(e?.message ?? "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const onTest = async () => {
    setTesting(true);
    setResult(null);
    const r = await testOrdersConnection({ baseUrl, token });
    setResult(r);
    setTesting(false);
  };

  return (
    <Card className="p-6 border-primary/30" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-2 mb-1">
        <PackageSearch className="h-5 w-5 text-primary" />
        <h2 className="font-bold">بخش مدیریت سفارشات (Orders API)</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        پیکربندی مستقل برای دریافت سفارش‌های روزانه و تاریخی مشتریان، جدا از سامانه‌های انبار و حسابداری.
      </p>
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> بارگذاری...</div>
      ) : (
        <div className="space-y-3">
          <Field label="Orders API Base URL" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.example.com/orders" />
          <Field label="Orders Authentication Token / Key" value={token} onChange={(e) => setToken(e.target.value)} type="password" />
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ذخیره"}
            </Button>
            <Button onClick={onTest} disabled={testing || !baseUrl} variant="outline" size="sm">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "تست اتصال"}
            </Button>
            {result && (
              <span className={`flex items-center gap-1 text-xs font-semibold ${result.ok ? "text-success" : "text-destructive"}`}>
                {result.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {result.message}
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

