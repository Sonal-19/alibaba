/**
 * GST helpers shared by the API and the admin web app (imported via `@api/*`),
 * so keep this file free of server-only imports.
 */

/** States and UTs with their 2-digit GST state codes. */
export const GST_STATES = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
] as const;

export const gstStateCodes = GST_STATES.map((s) => s.code);
export type GstStateCode = (typeof GST_STATES)[number]["code"];

export const gstStateName = (code: string) =>
  GST_STATES.find((s) => s.code === code)?.name ?? code;

/** Seller details as per GST Registration Certificate (Form GST REG-06). */
export const SELLER = {
  legalName: "SARDAR ALI",
  tradeName: "SARDAR ALI PRODUCTIONS",
  gstin: "03AHNPA7540D2ZS",
  addressLines: [
    "Vill. Matoi, Matoi Road,",
    "Near Matoi Bus Stop,",
    "Tehsil & District Malerkotla,",
    "Punjab - 148023",
  ],
  stateCode: "03",
  state: "Punjab",
} as const;

export type InvoiceSeller = {
  legalName: string;
  tradeName: string;
  gstin: string;
  addressLines: string[];
  stateCode: string;
  state: string;
  phone: string | null;
  email: string | null;
};

/** How the client paid. Bank account is the default. */
export const PAYMENT_METHODS = [
  { value: "bank", label: "Bank Account" },
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash Payment" },
] as const;
export const paymentMethodValues = ["bank", "upi", "cash"] as const;
export type PaymentMethod = (typeof paymentMethodValues)[number];
export const paymentMethodLabel = (v: string) =>
  PAYMENT_METHODS.find((m) => m.value === v)?.label ?? v;

export const INVOICE_PREFIX = "SAP";
export const GST_RATE = 18;
/** SAC 999631: services of performing artists (singers, musicians, …). */
export const DEFAULT_SAC = "999631";
export const DEFAULT_INVOICE_DESCRIPTION =
  "Live music performance (Show booking)";

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/**
 * Splits a GST-inclusive total (in paise) into taxable value and tax.
 * Intra-state (client in seller's state) → CGST + SGST, otherwise IGST.
 */
export function splitGst(totalPaise: number, clientStateCode: string) {
  const taxablePaise = Math.round((totalPaise * 100) / (100 + GST_RATE));
  const gst = totalPaise - taxablePaise;
  const intra = clientStateCode === SELLER.stateCode;
  const cgstPaise = intra ? Math.round(gst / 2) : 0;
  return {
    intra,
    totalPaise,
    taxablePaise,
    cgstPaise,
    sgstPaise: intra ? gst - cgstPaise : 0,
    igstPaise: intra ? 0 : gst,
  };
}

export const toPaise = (rupees: number) => Math.round(rupees * 100);

/** 2500000 → "25,000.00" (Indian digit grouping). */
export function formatPaise(paise: number) {
  return (paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Indian financial-year batch for a yyyy-MM-dd date: 2026-10-05 → "26-27". */
export function financialYearBatch(ymd: string) {
  const [y = 0, m = 0] = ymd.split("-").map(Number);
  const start = m >= 4 ? y : y - 1;
  return `${String(start % 100).padStart(2, "0")}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export const formatInvoiceNo = (batch: string, seq: number) =>
  `${INVOICE_PREFIX}/${batch}/${String(seq).padStart(4, "0")}`;

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function belowHundred(n: number) {
  return n < 20
    ? (ONES[n] ?? "")
    : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}

function belowThousand(n: number) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", rest ? belowHundred(rest) : ""]
    .filter(Boolean)
    .join(" ");
}

/** Whole number in words using the Indian system (Thousand, Lakh, Crore). */
export function numberInWords(n: number): string {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1000);
  const rest = n % 1000;
  return [
    crore ? `${numberInWords(crore)} Crore` : "",
    lakh ? `${belowHundred(lakh)} Lakh` : "",
    thousand ? `${belowHundred(thousand)} Thousand` : "",
    rest ? belowThousand(rest) : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** 2500050 → "Twenty Five Thousand Rupees And Fifty Paise Only" */
export function amountInWords(paise: number) {
  const rupees = Math.floor(paise / 100);
  return `${numberInWords(rupees)} Rupees And ${numberInWords(paise % 100)} Paise Only`;
}
