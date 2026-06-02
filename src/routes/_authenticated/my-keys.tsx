import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, UserCog, PackageSearch, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type MyCreds = {
  digikalaSellerId: string;
  digikalaApiKey: string;
  digikalaToken: string;
  ordersBaseUrl: string;
  ordersToken: string;
};

const DEFAULT: MyCreds = {
  digikalaSellerId: "",
  digikalaApiKey: "",
  digikalaToken: "",
  ordersBaseUrl: "",
  ordersToken: "",
};

export const Route = createFileRoute("/_authenticated/my-keys")({
  head: () => ({ meta: [{ title: "کلیدهای من — سرفیس استور" }] }),
  component: MyKeysPage,
});

function MyKeysPage() {
  const { user } = useAuth();
  const [data, setData] = useState<MyCreds>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const myId = auth.user?.id;
      if (!myId) { setLoading(false); return; }
      const { data: rows } = await supabase
        .from("api_credentials")
        .select("provider, credential_key, credential_value")
        .eq("owner_id", myId);
      const next = { ...DEFAULT };
      for (const r of rows ?? []) {
        if (r.provider === "integrations") {
          if (r.credential_key === "digikalaSellerId") next.digikalaSellerId = r.credential_value ?? "";
          if (r.credential_key === "digikalaApiKey") next.digikalaApiKey = r.credential_value ?? "";
          if (r.credential_key === "digikalaToken") next.digikalaToken = r.credential_value ?? "";
        }
        if (r.provider === "orders_api") {
          if (r.credential_key === "baseUrl") next.ordersBaseUrl = r.credential_value ?? "";
          if (r.credential_key === "token") next.ordersToken = r.credential_value ?? "";
        }
      }
      setData(next);
      setLoading(false);
    })();
  }, []);

  const set = (k: keyof MyCreds) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((d) => ({ ...d, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const myId = auth.user?.id;
      if (!myId) throw new Error("برای ذخیره کلیدها باید وارد حساب کاربری خود شوید");

      // Wipe only this user's rows for the two providers, then insert fresh.
      await supabase.from("api_credentials")
        .delete().eq("owner_id", myId).in("provider", ["integrations", "orders_api"]);

      const rows = [
        { provider: "integrations", credential_key: "digikalaSellerId", label: "Seller ID", credential_value: data.digikalaSellerId, owner_id: myId },
        { provider: "integrations", credential_key: "digikalaApiKey", label: "API Key", credential_value: data.digikalaApiKey, owner_id: myId },
        { provider: "integrations", credential_key: "digikalaToken", label: "Token", credential_value: data.digikalaToken, owner_id: myId },
        { provider: "orders_api", credential_key: "baseUrl", label: "Orders API Base URL", credential_value: data.ordersBaseUrl, owner_id: myId },
        { provider: "orders_api", credential_key: "token", label: "Orders Auth Token", credential_value: data.ordersToken, owner_id: myId },
      ].filter((r) => (r.credential_value ?? "").length > 0);

      if (rows.length) {
        const { error } = await supabase.from("api_credentials").insert(rows);
        if (error) throw error;
      }
      toast.success("کلیدهای اختصاصی شما در گاوصندوق ذخیره شد");
    } catch (e: any) {
      toast.error(e?.message ?? "ذخیره ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin ml-2" /> بارگذاری...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-5 text-sm border-primary/30 bg-primary/5 flex items-start gap-3">
        <UserCog className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-bold">کلیدهای اختصاصی کاربر — {user?.displayName}</p>
          <p className="text-muted-foreground mt-1">
            هر کاربر می‌تواند کلیدهای دیجی‌کالا و Orders API مخصوص خود را ذخیره کند. در صورت ثبت، تمامی فراخوانی‌های API هنگام ورود این کاربر با همین کلیدها انجام می‌شود؛ در غیر این صورت کلیدهای مشترک «مدیر ارشد» استفاده خواهند شد.
          </p>
        </div>
      </Card>

      <Card className="p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="font-bold">دیجی‌کالا (اختصاصی این حساب)</h2>
        </div>
        <div className="space-y-3">
          <Field label="Seller ID" value={data.digikalaSellerId} onChange={set("digikalaSellerId")} />
          <Field label="API Key" value={data.digikalaApiKey} onChange={set("digikalaApiKey")} type="password" />
          <Field label="Token" value={data.digikalaToken} onChange={set("digikalaToken")} type="password" />
        </div>
      </Card>

      <Card className="p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 mb-4">
          <PackageSearch className="h-5 w-5 text-primary" />
          <h2 className="font-bold">Orders API (اختصاصی این حساب)</h2>
        </div>
        <div className="space-y-3">
          <Field label="Orders API Base URL" value={data.ordersBaseUrl} onChange={set("ordersBaseUrl")} placeholder="https://api.example.com/orders" />
          <Field label="Orders Auth Token" value={data.ordersToken} onChange={set("ordersToken")} type="password" />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} size="lg" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          ذخیره کلیدهای من
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
