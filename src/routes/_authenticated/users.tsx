import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServerFn } from "@tanstack/react-start";
import { createUserWithRole } from "@/lib/users.functions";

type NewRole = "super_admin" | "manager" | "accountant" | "employee";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "مدیریت کاربران — سرفیس استور" }] }),
  component: () => <PermissionGate perm="manage_users"><Inner /></PermissionGate>,
});

type Row = { id: string; display_name: string | null; role: Role };

function Inner() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, display_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const order: Role[] = ["super_admin", "manager", "accountant", "employee", "warehouse", "viewer"];
    const merged: Row[] = (profiles ?? []).map((p) => {
      const userRoles = (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as Role);
      const role: Role = order.find((r) => userRoles.includes(r)) ?? "viewer";
      return { id: p.id, display_name: p.display_name, role };
    });
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateRole = async (uid: string, newRole: Role) => {
    // Replace all roles with the single new one
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", uid);
    if (delErr) return toast.error(delErr.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: newRole });
    if (error) return toast.error(error.message);
    toast.success("نقش به‌روزرسانی شد");
    load();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Card className="p-5 text-sm border-primary/20 bg-primary/5 flex items-start gap-3">
        <Users className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-bold">مدیریت کاربران و نقش‌ها</p>
          <p className="text-muted-foreground mt-1">
            ثبت‌نام از طریق صفحه ورود انجام می‌شود. در اینجا فقط می‌توانید نقش هر کاربر را تغییر دهید.
          </p>
        </div>
      </Card>

      <CreateUserCard onCreated={load} />


      <Card className="p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> در حال بارگذاری...</div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">کاربری ثبت نشده است.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{r.display_name || "بدون نام"}</p>
                  <p className="text-[11px] text-muted-foreground font-mono ltr-content text-left">{r.id.slice(0, 8)}…</p>
                </div>
                {r.id === user?.id && <Badge variant="secondary">شما</Badge>}
                <Select value={r.role} onValueChange={(v) => updateRole(r.id, v as Role)} disabled={r.id === user?.id}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                      <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function CreateUserCard({ onCreated }: { onCreated: () => void }) {
  const { can } = useAuth();
  const createFn = useServerFn(createUserWithRole);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<NewRole>("employee");
  const [submitting, setSubmitting] = useState(false);

  // Only super_admin / manager can create users
  if (!can("manage_users")) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("رمز عبور باید حداقل ۶ کاراکتر باشد");
    setSubmitting(true);
    try {
      await createFn({ data: { displayName, email, password, role } });
      toast.success("کاربر با موفقیت ایجاد شد");
      setDisplayName(""); setEmail(""); setPassword(""); setRole("employee");
      onCreated();
    } catch (err: any) {
      toast.error(err?.message ?? "خطا در ایجاد کاربر");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-5 w-5 text-primary" />
        <p className="font-bold">ایجاد کاربر جدید</p>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="cu-name">نام</Label>
          <Input id="cu-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cu-email">ایمیل</Label>
          <Input id="cu-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cu-pass">رمز عبور (حداقل ۶ کاراکتر)</Label>
          <Input id="cu-pass" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} maxLength={128} />
        </div>
        <div className="space-y-1.5">
          <Label>نقش</Label>
          <Select value={role} onValueChange={(v) => setRole(v as NewRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="super_admin">{ROLE_LABELS.super_admin} (مدیر ارشد)</SelectItem>
              <SelectItem value="manager">{ROLE_LABELS.manager}</SelectItem>
              <SelectItem value="accountant">{ROLE_LABELS.accountant}</SelectItem>
              <SelectItem value="employee">{ROLE_LABELS.employee}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            ایجاد کاربر
          </Button>
        </div>
      </form>
    </Card>
  );
}
