import { createFileRoute } from "@tanstack/react-router";
import { BulkManager } from "@/components/BulkManager";
import { AedRateBar } from "@/components/AedRateBar";
import { useCatalog } from "@/hooks/useCatalog";
import { useAedRate } from "@/hooks/useAedRate";
import { PermissionGate } from "@/components/PermissionGate";

export const Route = createFileRoute("/_authenticated/bulk")({
  head: () => ({ meta: [{ title: "ورود/خروج اکسل — سرفیس استور" }] }),
  component: BulkPage,
});

function BulkPage() {
  const catalog = useCatalog();
  const { rate } = useAedRate();
  return (
    <PermissionGate perm="bulk_import">
      <div className="space-y-6 max-w-7xl">
        <AedRateBar />
        <BulkManager onAddToCatalog={catalog.addMany} aedRate={rate} />
      </div>
    </PermissionGate>
  );
}
