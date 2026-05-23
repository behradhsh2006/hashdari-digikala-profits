export type Pricing = {
  finalPrice: number;
  commissionAmount: number;
  totalCosts: number;
  netProfit: number;
  valid: boolean;
};

export function calcPricing(
  purchase: number,
  fixed: number,
  profit: number,
  commission: number
): Pricing {
  const totalCosts = (purchase || 0) + (fixed || 0);
  const denom = 1 - (commission || 0) / 100;
  const sum = totalCosts + (profit || 0);
  const valid = denom > 0 && sum > 0;
  const finalPrice = valid ? sum / denom : 0;
  const commissionAmount = finalPrice * ((commission || 0) / 100);
  return { finalPrice, commissionAmount, totalCosts, netProfit: profit || 0, valid };
}
