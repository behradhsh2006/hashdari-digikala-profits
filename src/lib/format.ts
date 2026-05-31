export const formatToman = (n: number, maxDecimals = 2) => {
  if (!isFinite(n) || isNaN(n)) return "۰";
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: 0,
    useGrouping: true,
  }).format(n);
};

export const parseNumber = (s: string): number => {
  if (!s) return 0;
  // accept Persian/Arabic digits and commas
  const normalized = s
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[,،\s]/g, "");
  const n = Number(normalized);
  return isNaN(n) ? 0 : n;
};
