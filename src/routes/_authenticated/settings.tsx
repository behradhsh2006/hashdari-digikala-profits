import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, KeyRound, Globe } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";

const KEY = "app-integrations-v1";

type Integrations = {
  digikalaSellerId: string;
  digikalaApiKey: string;
  digikalaToken: string;
  externalApiUrl: string;
  externalApiToken: string;
};

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

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setData({ ...DEFAULT, ...JSON.parse(raw) }); } catch {}
  }, []);

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(data));
    toast.success("تنظیمات ذخیره شد");
  };

  const set = (k: keyof Integrations) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-5 text-sm border-primary/20 bg-primary/5 flex items-start gap-3">
        <Settings className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-bold">تنظیمات یکپارچه‌سازی</p>
          <p className="text-muted-foreground mt-1">
            کلیدها به صورت محلی (LocalStorage) ذخیره می‌شوند. برای امنیت بالا و فراخوانی واقعی API، فعال‌سازی Lovable Cloud توصیه می‌شود.
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

      <div className="flex justify-end">
        <Button onClick={save} size="lg">ذخیره تنظیمات</Button>
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
      <Input value={value} onChange={onChange} type={type} dir="ltr" className="text-left" placeholder={placeholder} />
    </div>
  );
}
