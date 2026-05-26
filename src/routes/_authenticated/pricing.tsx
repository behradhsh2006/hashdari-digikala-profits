import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, ListOrdered } from "lucide-react";
import { SingleCalculator } from "@/components/SingleCalculator";
import { ProductList } from "@/components/ProductList";
import { AedRateBar } from "@/components/AedRateBar";
import { useCatalog } from "@/hooks/useCatalog";
import { useAedRate } from "@/hooks/useAedRate";
import { PermissionGate } from "@/components/PermissionGate";

export const Route = createFileRoute("/_authenticated/pricing")({
  head: () => ({ meta: [{ title: "ماشین‌حساب قیمت — سرفیس استور" }] }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <PermissionGate perm="view_pricing">
      <Inner />
    </PermissionGate>
  );
}

function Inner() {
  const catalog = useCatalog();
  const { rate } = useAedRate();
  const [tab, setTab] = useState("calc");

  return (
    <div className="space-y-6 max-w-7xl">
      <AedRateBar />

      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <TabsList className="grid grid-cols-2 max-w-md h-11 p-1">
          <TabsTrigger value="calc" className="gap-2"><Calculator className="h-4 w-4" /> ماشین‌حساب</TabsTrigger>
          <TabsTrigger value="list" className="gap-2"><ListOrdered className="h-4 w-4" /> کاتالوگ ({catalog.items.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="calc">
          <SingleCalculator onSave={catalog.add} aedRate={rate} />
        </TabsContent>
        <TabsContent value="list">
          <ProductList items={catalog.items} onUpdate={catalog.update} onRemove={catalog.remove} onClear={catalog.clear} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
