import { useAuth } from "@/hooks/useAuth";
import type { Permission } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

export function PermissionGate({ perm, children }: { perm: Permission; children: ReactNode }) {
  const { can } = useAuth();
  if (!can(perm)) {
    return (
      <Card className="p-10 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-3" />
        <p className="font-bold text-lg">دسترسی محدود</p>
        <p className="text-sm text-muted-foreground mt-2">
          شما مجوز مشاهده این بخش را ندارید. در صورت نیاز با مدیر سیستم تماس بگیرید.
        </p>
      </Card>
    );
  }
  return <>{children}</>;
}
