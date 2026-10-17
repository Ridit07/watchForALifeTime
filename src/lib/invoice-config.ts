/**
 * Everything on the tax invoice that is about the seller rather than the
 * order. These values are printed verbatim on a legal document, so they live
 * in one place where they can be checked against the showroom's paperwork.
 */
export const invoiceConfig = {
  /** Printed top-left. A GST invoice is invalid without it. */
  gstin: process.env.INVOICE_GSTIN || "",

  /** The registered trading name, which need not match the website name. */
  legalName: "LIFE TIME",

  address: "Shop 501/15, NA, Sohna Chowk, Gurugram, Haryana, 122001",

  /** Seller's state decides CGST+SGST (intra-state) versus IGST. */
  stateName: "Haryana",
  stateCode: "06",

  /** 18% on watches: 9% CGST + 9% SGST within Haryana, else 18% IGST. */
  gstRate: 0.18,

  /** HSN 9102 covers wrist-watches; the 8-digit form is on the showroom bill. */
  defaultHsn: "91022900",

  unit: "Pcs",

  terms: [
    "E.& O.E.",
    "1. Goods once sold will not be returned.",
    "2. Goods can still be exchanged within 3 days of the Purchase given the original tags are intact and the watch has not been used.",
    "3. Subject to 'Haryana' jurisdiction.",
  ],
} as const;

/** India's financial year runs April to March, so 17 Oct 2026 is 2026-27. */
export function financialYear(date: Date): string {
  const y = date.getFullYear();
  const start = date.getMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/**
 * The invoice number. GST requires a unique series that runs in sequence for
 * the financial year; Shopify's order numbers already increment, so they are
 * used as the series rather than inventing a second counter that could drift.
 */
export function invoiceNumber(orderNumber: number, processedAt: string): string {
  return `${orderNumber}/${financialYear(new Date(processedAt))}`;
}

/** GST state codes, for "Place of Supply" and the intra/inter-state test. */
export const STATE_CODES: Record<string, string> = {
  "andaman and nicobar islands": "35",
  "andhra pradesh": "37",
  "arunachal pradesh": "12",
  assam: "18",
  bihar: "10",
  chandigarh: "04",
  chhattisgarh: "22",
  "dadra and nagar haveli and daman and diu": "26",
  delhi: "07",
  goa: "30",
  gujarat: "24",
  haryana: "06",
  "himachal pradesh": "02",
  "jammu and kashmir": "01",
  jharkhand: "20",
  karnataka: "29",
  kerala: "32",
  ladakh: "38",
  lakshadweep: "31",
  "madhya pradesh": "23",
  maharashtra: "27",
  manipur: "14",
  meghalaya: "17",
  mizoram: "15",
  nagaland: "13",
  odisha: "21",
  puducherry: "34",
  punjab: "03",
  rajasthan: "08",
  sikkim: "11",
  "tamil nadu": "33",
  telangana: "36",
  tripura: "16",
  "uttar pradesh": "09",
  uttarakhand: "05",
  "west bengal": "19",
};

export function stateCodeOf(province: string | null): string | null {
  if (!province) return null;
  return STATE_CODES[province.trim().toLowerCase()] ?? null;
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty",
  "Ninety",
];

function underThousand(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) {
    return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
  }
  const rest = n % 100;
  return `${ONES[Math.floor(n / 100)]} Hundred${rest ? ` ${underThousand(rest)}` : ""}`;
}

/** Indian grouping — crore, lakh, thousand — not the western short scale. */
export function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Rupees Zero Only";

  const parts: string[] = [];
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;

  if (crore) parts.push(`${underThousand(crore)} Crore`);
  if (lakh) parts.push(`${underThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${underThousand(thousand)} Thousand`);
  if (rest) parts.push(underThousand(rest));

  let words = `Rupees ${parts.join(" ")}`;
  if (paise) words += ` and ${underThousand(paise)} Paise`;

  return `${words} Only`;
}
