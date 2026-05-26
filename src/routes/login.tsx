import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogIn, Package, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "ورود به پنل — سرفیس استور" },
      { name: "description", content: "ورود به سامانه مدیریت موجودی و قیمت‌گذاری." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/dashboard", replace: true });
  }, [ready, user, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = login(username, password);
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    toast.success("ورود موفق");
    navigate({ to: "/dashboard", replace: true });
  };

  const quick = (u: string, p: string) => { setUsername(u); setPassword(p); };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-6 text-primary-foreground">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-white/15 backdrop-blur items-center justify-center mb-3">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold">پنل مدیریت سرفیس استور</h1>
          <p className="text-sm text-primary-foreground/85 mt-1">موجودی، قیمت‌گذاری و گزارش‌های دیجی‌کالا</p>
        </div>

        <Card className="p-6 md:p-8" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u">نام کاربری</Label>
              <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)}
                autoComplete="username" className="h-11" placeholder="admin" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p">رمز عبور</Label>
              <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" className="h-11" placeholder="••••••" required />
            </div>
            <Button type="submit" size="lg" className="w-full gap-2" disabled={busy}>
              <LogIn className="h-4 w-4" /> ورود به سیستم
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t">
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              برای تست سریع از حساب‌های زیر استفاده کنید:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => quick("admin", "admin")}
                className="text-right p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition">
                <p className="text-xs font-bold flex items-center gap-1"><User className="h-3 w-3" /> مدیر ارشد</p>
                <p className="text-[11px] text-muted-foreground mt-1">admin / admin</p>
              </button>
              <button type="button" onClick={() => quick("staff", "staff")}
                className="text-right p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition">
                <p className="text-xs font-bold flex items-center gap-1"><User className="h-3 w-3" /> کارمند انبار</p>
                <p className="text-[11px] text-muted-foreground mt-1">staff / staff</p>
              </button>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-primary-foreground/80 mt-5">
          نسخه نمایشی — احراز هویت محلی (LocalStorage)
        </p>
      </div>
    </div>
  );
}
