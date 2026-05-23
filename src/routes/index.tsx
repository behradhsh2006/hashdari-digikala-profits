import { createFileRoute } from "@tanstack/react-router";
import { PricingCalculator } from "@/components/PricingCalculator";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ماشین‌حساب قیمت‌گذاری دیجی‌کالا" },
      { name: "description", content: "محاسبه قیمت فروش نهایی محصولات با درنظر گرفتن کمیسیون دیجی‌کالا، هزینه‌ها و سود خالص." },
    ],
  }),
});

function Index() {
  return <PricingCalculator />;
}
