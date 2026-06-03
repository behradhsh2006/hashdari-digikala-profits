import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { roleHome, ROLE_LABELS } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/access-denied")({
  head: () => ({ meta: [{ title: "دسترسی محدود — سرفیس استور" }] }),
  component: AccessDenied,
});

function AccessDenied() {
  const { user } = useAuth();
  return (
    <div className="max-w-xl mx-auto mt-12">
      <Card className="p-10 text-center">
        <ShieldAlert className="h-14 w-14 mx-auto text-destructive mb-4" />
        <h1 className="text-2xl font-extrabold">دسترسی محدود</h1>
        <p className="text-sm text-muted-foreground mt-3">
          نقش فعلی شما ({user ? ROLE_LABELS[user.role] : "نامشخص"}) اجازه مشاهده این بخش را ندارد.
          لطفاً به صفحه اصلی خود بازگردید یا با مدیر سیستم تماس بگیرید.
        </p>
        <div className="mt-6 flex gap-2 justify-center">
          <Button asChild>
            <Link to={roleHome(user?.role)}>بازگشت به صفحه اصلی</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
