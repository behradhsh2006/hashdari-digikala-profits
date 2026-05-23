import * as XLSX from "xlsx";

export type RawRow = {
  name: string;
  purchase: number;
  fixed: number;
  profit: number;
  commission: number;
  missingFields: string[];
};

const COLUMN_ALIASES: Record<keyof Omit<RawRow, "missingFields">, string[]> = {
  name: ["product name", "name", "نام محصول", "محصول", "نام"],
  purchase: ["purchase price", "purchase", "قیمت خرید", "خرید"],
  fixed: ["fixed costs", "fixed cost", "fixed", "هزینه ثابت", "هزینه‌های ثابت", "هزینه"],
  profit: ["desired profit", "profit", "سود", "سود خالص", "سود دلخواه"],
  commission: ["commission", "commission %", "کمیسیون", "درصد کمیسیون"],
};

function normalizeKey(k: string): string {
  return String(k || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function toNumber(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return v;
  const s = String(v)
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[,،\s%٪تومانrial]/gi, "");
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

export async function parseSpreadsheet(file: File): Promise<RawRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return json.map((row) => {
    const keyMap: Record<string, string> = {};
    for (const k of Object.keys(row)) keyMap[normalizeKey(k)] = k;

    const pick = (field: keyof typeof COLUMN_ALIASES) => {
      for (const alias of COLUMN_ALIASES[field]) {
        const k = keyMap[normalizeKey(alias)];
        if (k !== undefined) return row[k];
      }
      return undefined;
    };

    const name = String(pick("name") ?? "").trim();
    const purchase = toNumber(pick("purchase"));
    const fixed = toNumber(pick("fixed"));
    const profit = toNumber(pick("profit"));
    const commission = toNumber(pick("commission"));

    const missing: string[] = [];
    if (!name) missing.push("نام محصول");
    if (purchase <= 0) missing.push("قیمت خرید");
    if (profit <= 0) missing.push("سود");
    if (commission <= 0 || commission >= 100) missing.push("کمیسیون");

    return { name, purchase, fixed, profit, commission, missingFields: missing };
  });
}

export function downloadExcel<T extends Record<string, unknown>>(
  rows: T[],
  filename: string
) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "محصولات");
  XLSX.writeFile(wb, filename);
}

export function downloadTemplate() {
  const sample = [
    {
      "نام محصول": "هدفون بلوتوثی",
      "قیمت خرید": 500000,
      "هزینه ثابت": 30000,
      "سود": 150000,
      "کمیسیون": 12,
    },
    {
      "نام محصول": "ساعت هوشمند",
      "قیمت خرید": 1200000,
      "هزینه ثابت": 50000,
      "سود": 300000,
      "کمیسیون": 8,
    },
  ];
  downloadExcel(sample, "نمونه-قالب-دیجی‌کالا.xlsx");
}
