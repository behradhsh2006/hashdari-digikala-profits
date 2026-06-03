import { useAuth } from "@/hooks/useAuth";
import { roleHome, type Permission } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

type Props = {
  perm: Permission;
  children: ReactNode;
  /** When true (default), automatically redirect unauthorized users to their role home. */
  redirect?: boolean;
};

export function PermissionGate({ perm, children, redirect = true }: Props) {
  const { can, user } = useAuth();
  const navigate = useNavigate();
  const allowed = can(perm);

  useEffect(() => {
    if (!allowed && redirect) {
      navigate({ to: "/access-denied", replace: true });
    }
  }, [allowed, redirect, navigate]);

  if (!allowed) {
    return (
      <Card className="p-10 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-3" />
        <p className="font-bold text-lg">دسترسی محدود</p>
        <p className="text-sm text-muted-foreground mt-2">
          شما مجوز مشاهده این بخش را ندارید. در صورت نیاز با مدیر سیستم تماس بگیرید.
        </p>
        <div className="mt-5">
          <Button asChild>
            <Link to={roleHome(user?.role)}>بازگشت به صفحه اصلی</Link>
          </Button>
        </div>
      </Card>
    );
  }
  return <>{children}</>;
}
