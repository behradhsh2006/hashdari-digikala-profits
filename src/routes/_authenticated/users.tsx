import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
    const order: Role[] = ["super_admin", "manager", "warehouse", "viewer"];
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
