import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, ShieldCheck, UserCog } from "lucide-react";
import { useAuth, type AppUser } from "@/hooks/useAuth";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { toJalaliShort } from "@/lib/jalali";
import { toast } from "sonner";
import { PermissionGate } from "@/components/PermissionGate";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "مدیریت کاربران — سرفیس استور" }] }),
  component: UsersPage,
});

function UsersPage() {
  return (
    <PermissionGate perm="manage_users">
      <Inner />
    </PermissionGate>
  );
}

function Inner() {
  const { users, user: me, createUser, deleteUser, updateUser } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5 max-w-5xl">
      <Card className="p-5 flex items-start gap-3 border-primary/20 bg-primary/5">
        <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
        <div className="text-sm">
          <p className="font-bold">پنل مدیریت کاربران</p>
          <p className="text-muted-foreground mt-1">
            این بخش فقط برای «مدیر ارشد» قابل دسترسی است. ایجاد کاربر، تعیین نقش و دسترسی‌ها از اینجا انجام می‌شود.
          </p>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} کاربر در سیستم</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> افزودن کاربر</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>ایجاد کاربر جدید</DialogTitle></DialogHeader>
            <UserForm
              onSubmit={(data) => {
                const r = createUser(data);
                if (!r.ok) return toast.error(r.error ?? "خطا");
                setOpen(false);
                toast.success("کاربر ساخته شد");
              }}
            />
          </DialogContent>
        </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="text-right px-3 py-3 text-xs font-semibold">نام کاربری</th>
                <th className="text-right px-3 py-3 text-xs font-semibold">نام نمایشی</th>
                <th className="text-right px-3 py-3 text-xs font-semibold">نقش</th>
                <th className="text-right px-3 py-3 text-xs font-semibold">تاریخ ایجاد</th>
                <th className="text-right px-3 py-3 text-xs font-semibold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2.5"><code className="text-xs font-bold">{u.username}</code>
                    {me?.id === u.id && <Badge variant="secondary" className="ms-2 text-[10px]">شما</Badge>}
                  </td>
                  <td className="px-3 py-2.5">{u.displayName}</td>
                  <td className="px-3 py-2.5">
                    <Select value={u.role} onValueChange={(v) => updateUser(u.id, { role: v as Role })}
                      disabled={me?.id === u.id}>
                      <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2.5 text-xs tabular-nums">{toJalaliShort(u.createdAt)}</td>
                  <td className="px-3 py-2.5">
                    <Button size="icon" variant="ghost" className="text-destructive"
                      disabled={me?.id === u.id}
                      onClick={() => { if (confirm(`حذف ${u.username}؟`)) { deleteUser(u.id); toast.success("حذف شد"); } }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5 text-sm text-muted-foreground border-dashed flex items-start gap-3">
        <UserCog className="h-5 w-5 mt-0.5 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-foreground">دسترسی‌های نقش‌ها</p>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed">
            <li>• <b>مدیر ارشد:</b> دسترسی کامل به همه بخش‌ها شامل کاربران، تنظیمات و گزارش مالی.</li>
            <li>• <b>مدیر:</b> همه بخش‌ها به جز مدیریت کاربران و تنظیمات API.</li>
            <li>• <b>کارمند انبار:</b> فقط محصولات، سریال‌ها، تعهدات و داشبورد (بدون اطلاعات مالی).</li>
            <li>• <b>بازدیدکننده:</b> مشاهده‌ی محصولات و سریال‌ها به‌صورت فقط‌خواندنی.</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

function UserForm({ onSubmit }: { onSubmit: (data: Omit<AppUser, "id" | "createdAt">) => void }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<Role>("warehouse");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ username: username.trim(), displayName: displayName.trim() || username.trim(), role, password });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label className="text-xs">نام کاربری</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} dir="ltr" placeholder="username" /></div>
        <div className="space-y-1.5"><Label className="text-xs">نام نمایشی</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="نام و نام خانوادگی" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label className="text-xs">رمز عبور</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" /></div>
        <div className="space-y-1.5"><Label className="text-xs">نقش</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end pt-2"><Button type="submit" size="lg">ایجاد کاربر</Button></div>
    </form>
  );
}
