import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "ورود — سرفیس استور" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { ready, user, signIn, signUp, signInWithGoogle } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Navigate to="/dashboard" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await signIn(email.trim(), password);
    setBusy(false);
    if (!r.ok) return toast.error(r.error || "خطا در ورود");
    toast.success("خوش آمدید");
    nav({ to: "/dashboard" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await signUp(email.trim(), password, displayName.trim() || email.split("@")[0]);
    setBusy(false);
    if (!r.ok) return toast.error(r.error || "خطا در ثبت‌نام");
    toast.success("حساب ساخته شد. لطفاً ایمیل خود را تأیید کنید.");
    setTab("signin");
  };

  const handleGoogle = async () => {
    setBusy(true);
    try { await signInWithGoogle(); } catch (e: any) { toast.error(e?.message ?? "خطای ورود گوگل"); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md p-6 sm:p-8" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-primary-foreground mb-3"
               style={{ background: "var(--gradient-primary)" }}>
            <Package className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold">سرفیس استور</h1>
          <p className="text-sm text-muted-foreground mt-1">پنل مدیریت فروشنده دیجی‌کالا</p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-5 w-full">
            <TabsTrigger value="signin">ورود</TabsTrigger>
            <TabsTrigger value="signup">ثبت‌نام</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-3">
              <Field label="ایمیل" value={email} onChange={setEmail} type="email" />
              <Field label="رمز عبور" value={password} onChange={setPassword} type="password" />
              <Button type="submit" disabled={busy} className="w-full" size="lg">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "ورود به پنل"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-3">
              <Field label="نام نمایشی" value={displayName} onChange={setDisplayName} />
              <Field label="ایمیل" value={email} onChange={setEmail} type="email" />
              <Field label="رمز عبور (حداقل ۶ نویسه)" value={password} onChange={setPassword} type="password" />
              <Button type="submit" disabled={busy} className="w-full" size="lg">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "ساخت حساب"}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                اولین کاربر ثبت‌نام‌شده به‌صورت خودکار «مدیر ارشد» می‌شود.
              </p>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-[11px]"><span className="bg-card px-2 text-muted-foreground">یا</span></div>
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
          ورود با گوگل
        </Button>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (s: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} type={type} dir="ltr" className="text-left" required />
    </div>
  );
}
