import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/lib/permissions";
import {
  LayoutDashboard, Package, Barcode, Calculator, FileSpreadsheet,
  Truck, Wallet, Users, Settings, LogOut, Menu, X, KeyRound,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { useState, type ReactNode } from "react";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; perm: Permission };

const NAV: NavItem[] = [
  { to: "/dashboard",   label: "داشبورد",            icon: LayoutDashboard, perm: "view_dashboard" },
  { to: "/inventory",   label: "محصولات",            icon: Package,         perm: "view_inventory" },
  { to: "/serials",     label: "شماره سریال‌ها",      icon: Barcode,         perm: "view_serials" },
  { to: "/pricing",     label: "ماشین‌حساب قیمت",     icon: Calculator,      perm: "view_pricing" },
  { to: "/bulk",        label: "ورود/خروج اکسل",     icon: FileSpreadsheet, perm: "bulk_import" },
  { to: "/commitments", label: "تعهدات دیجی‌کالا",    icon: Truck,           perm: "view_commitments" },
  { to: "/financials",  label: "گزارش مالی",         icon: Wallet,          perm: "view_financials" },
  { to: "/my-keys",     label: "کلیدهای من",          icon: KeyRound,        perm: "view_dashboard" },
  { to: "/users",       label: "مدیریت کاربران",      icon: Users,           perm: "manage_users" },
  { to: "/settings",    label: "تنظیمات و API",       icon: Settings,        perm: "manage_settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, can } = useAuth();
  const { location } = useRouterState();
  const [open, setOpen] = useState(false);

  const visible = NAV.filter((n) => can(n.perm));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 z-40 h-screen w-64 bg-card border-l shrink-0 transition-transform ${open ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}>
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className="font-extrabold leading-tight">سرفیس استور</p>
            <p className="text-[10px] text-muted-foreground">پنل مدیریت</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {visible.map((n) => {
            const active = location.pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to} to={n.to} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-accent"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 inset-x-0 p-3 border-t bg-card">
          <div className="px-2 py-2">
            <p className="text-sm font-semibold truncate">{user?.displayName}</p>
            <p className="text-[11px] text-muted-foreground">{user && ROLE_LABELS[user.role]}</p>
          </div>
          <Button variant="ghost" onClick={logout} className="w-full justify-start gap-2 text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4" /> خروج
          </Button>
        </div>
      </aside>

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 sticky top-0 z-20 bg-background/85 backdrop-blur border-b flex items-center px-4 lg:px-8 gap-3">
          <button className="lg:hidden p-2 rounded-md hover:bg-accent" onClick={() => setOpen((v) => !v)} aria-label="منو">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <h1 className="font-bold text-lg truncate">
            {visible.find((n) => n.to === location.pathname)?.label ?? "پنل مدیریت"}
          </h1>
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span>{user?.displayName}</span>
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
              {user && ROLE_LABELS[user.role]}
            </span>
          </div>
        </header>

        <main className="p-4 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
