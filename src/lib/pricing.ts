export type Pricing = {
  finalPrice: number;
  commissionAmount: number;
  totalCosts: number;
  netProfit: number;
  profitAmount: number;
  valid: boolean;
};

/**
 * Percentage-based profit pricing.
 * profitPercent is a % of the purchase cost (e.g. 20 = 20%).
 * Formula:
 *   profitAmount = purchase * (profitPercent / 100)
 *   finalPrice   = (purchase + fixed + profitAmount) / (1 - commission/100)
 */
export function calcPricing(
  purchase: number,
  fixed: number,
  profitPercent: number,
  commission: number
): Pricing {
  const p = purchase || 0;
  const f = fixed || 0;
  const profitAmount = p * ((profitPercent || 0) / 100);
  const totalCosts = p + f;
  const denom = 1 - (commission || 0) / 100;
  const sum = totalCosts + profitAmount;
  const valid = denom > 0 && sum > 0;
  const finalPrice = valid ? sum / denom : 0;
  const commissionAmount = finalPrice * ((commission || 0) / 100);
  return {
    finalPrice,
    commissionAmount,
    totalCosts,
    profitAmount,
    netProfit: profitAmount,
    valid,
  };
}
