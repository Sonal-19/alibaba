import {
  degrees,
  PDFDocument,
  type PDFFont,
  type PDFPage,
  rgb,
  StandardFonts,
} from "pdf-lib";
import type { SelectInvoice } from "$/db/schema";
import {
  amountInWords,
  formatPaise,
  GST_RATE,
  paymentMethodLabel,
} from "$/lib/utils/gst";

const hex = (h: string) =>
  rgb(
    Number.parseInt(h.slice(1, 3), 16) / 255,
    Number.parseInt(h.slice(3, 5), 16) / 255,
    Number.parseInt(h.slice(5, 7), 16) / 255,
  );

// Brand palette (see scripts/gen-assets.ts)
const NIGHT = hex("#0b1f1c");
const MAROON = hex("#8a2846");
const GOLD = hex("#c9a24a");
const IVORY = hex("#f7f2e7");
const MUTED = hex("#5b6563");
const RULE = hex("#d9d4c7");
const WHITE = rgb(1, 1, 1);

const A4 = { w: 595.28, h: 841.89 };
const M = 40; // page margin

type Fonts = { regular: PDFFont; bold: PDFFont };

/** Standard PDF fonts only cover WinAnsi; swap anything else for "?". */
function safe(font: PDFFont, text: string) {
  const charset = new Set(font.getCharacterSet());
  return [...text.replace(/\s+/g, " ")]
    .map((c) => (charset.has(c.codePointAt(0) ?? 0) ? c : "?"))
    .join("");
}

function wrapText(font: PDFFont, size: number, text: string, maxWidth: number) {
  const lines: string[] = [];
  for (const para of text.split(/\n+/)) {
    let line = "";
    for (const word of safe(font, para).split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** Draws text with a top-down `y`; returns the y below the drawn block. */
function text(
  page: PDFPage,
  font: PDFFont,
  value: string,
  x: number,
  y: number,
  opts: {
    size?: number;
    color?: ReturnType<typeof rgb>;
    maxWidth?: number;
    align?: "left" | "right" | "center";
    lineGap?: number;
  } = {},
) {
  const size = opts.size ?? 9;
  const lines = opts.maxWidth
    ? wrapText(font, size, value, opts.maxWidth)
    : [safe(font, value)];
  const lh = size + (opts.lineGap ?? 3);
  for (const [i, line] of lines.entries()) {
    const w = font.widthOfTextAtSize(line, size);
    const dx =
      opts.align === "right" ? -w : opts.align === "center" ? -w / 2 : 0;
    page.drawText(line, {
      x: x + dx,
      y: A4.h - (y + size + i * lh),
      size,
      font,
      color: opts.color ?? NIGHT,
    });
  }
  return y + lines.length * lh;
}

function rect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  color: ReturnType<typeof rgb>,
) {
  page.drawRectangle({ x, y: A4.h - y - h, width: w, height: h, color });
}

function hline(page: PDFPage, y: number, x1 = M, x2 = A4.w - M) {
  page.drawLine({
    start: { x: x1, y: A4.h - y },
    end: { x: x2, y: A4.h - y },
    thickness: 0.6,
    color: RULE,
  });
}

function formatInvoiceDate(ymd: string) {
  return new Date(`${ymd}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function renderInvoicePdf(inv: SelectInvoice) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Tax Invoice ${inv.invoiceNo}`);
  doc.setAuthor(inv.seller.tradeName);
  doc.setCreator(inv.seller.tradeName);
  const page = doc.addPage([A4.w, A4.h]);
  const f: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const s = inv.seller;
  const right = A4.w - M;

  // Brand band
  rect(page, 0, 0, A4.w, 6, MAROON);
  rect(page, 0, 6, A4.w, 2, GOLD);

  // Title
  let y = 28;
  y = text(page, f.bold, "TAX INVOICE", A4.w / 2, y, {
    size: 18,
    align: "center",
  });
  text(page, f.regular, "Original for Recipient", A4.w / 2, y, {
    size: 9,
    align: "center",
    color: MUTED,
  });

  // Three header columns: seller · billed to · invoice meta
  const top = 80;
  const colW = (A4.w - 2 * M - 30) / 3;
  const c1 = M;
  const c2 = M + colW + 15;
  const c3 = M + 2 * (colW + 15);

  let y1 = text(page, f.bold, s.tradeName, c1, top, {
    size: 12,
    color: MAROON,
    maxWidth: colW,
  });
  rect(page, c1, y1 + 1, 40, 1.5, GOLD);
  y1 += 7;
  y1 = text(page, f.bold, s.legalName, c1, y1, { size: 9 });
  for (const line of s.addressLines)
    y1 = text(page, f.regular, line, c1, y1, { maxWidth: colW });
  y1 = text(page, f.regular, `State: ${s.state} (Code ${s.stateCode})`, c1, y1);
  y1 = text(page, f.bold, `GSTIN: ${s.gstin}`, c1, y1 + 2);
  if (s.phone) y1 = text(page, f.regular, `Phone: ${s.phone}`, c1, y1 + 2);
  if (s.email)
    y1 = text(page, f.regular, `Email: ${s.email}`, c1, y1, { maxWidth: colW });

  let y2 = text(page, f.regular, "Billed To:", c2, top, { color: MUTED });
  y2 = text(page, f.bold, inv.clientName, c2, y2 + 2, {
    size: 10,
    maxWidth: colW,
  });
  if (inv.clientAddress)
    y2 = text(page, f.regular, inv.clientAddress, c2, y2, { maxWidth: colW });
  y2 = text(
    page,
    f.regular,
    `State: ${inv.clientState} (Code ${inv.clientStateCode})`,
    c2,
    y2,
    { maxWidth: colW },
  );
  if (inv.clientMobile)
    y2 = text(page, f.regular, `Mobile: ${inv.clientMobile}`, c2, y2);
  if (inv.clientGstin)
    y2 = text(page, f.bold, `GSTIN: ${inv.clientGstin}`, c2, y2 + 2);

  const meta: [string, string][] = [
    ["Invoice No:", inv.invoiceNo],
    ["Date:", formatInvoiceDate(inv.invoiceDate)],
    ["Place of Supply:", `${inv.clientStateCode}-${inv.clientState}`],
    ["Payment Mode:", paymentMethodLabel(inv.paymentMethod)],
    ["Reverse Charge:", "No"],
  ];
  let y3 = top;
  for (const [k, v] of meta) {
    y3 = text(page, f.regular, k, c3, y3, { color: MUTED });
    y3 = text(page, f.bold, v, c3, y3, { maxWidth: colW }) + 4;
  }

  // Line items table
  y = Math.max(y1, y2, y3) + 22;
  const cols = {
    desc: M + 8,
    sac: M + 300,
    gst: M + 375,
    amt: right - 8,
  };
  hline(page, y);
  rect(page, M, y, A4.w - 2 * M, 22, IVORY);
  const th = { size: 8.5, color: MAROON };
  text(page, f.bold, "DESCRIPTION", cols.desc, y + 7, th);
  text(page, f.bold, "SAC", cols.sac, y + 7, th);
  text(page, f.bold, "GST %", cols.gst, y + 7, th);
  text(page, f.bold, "AMOUNT (INR)", cols.amt, y + 7, {
    ...th,
    align: "right",
  });
  y += 22;
  hline(page, y);
  y += 10;
  const descEnd = text(page, f.regular, inv.description, cols.desc, y, {
    size: 9.5,
    maxWidth: cols.sac - cols.desc - 16,
  });
  text(page, f.regular, inv.sac, cols.sac, y, { size: 9.5 });
  text(page, f.regular, GST_RATE.toFixed(2), cols.gst, y, { size: 9.5 });
  text(page, f.regular, formatPaise(inv.taxablePaise), cols.amt, y, {
    size: 9.5,
    align: "right",
  });
  y = descEnd + 10;
  hline(page, y);

  // Totals
  y += 14;
  const labelX = right - 150;
  const rows: [string, number, boolean][] = [
    ["Taxable Value", inv.taxablePaise, true],
  ];
  if (inv.igstPaise > 0)
    rows.push([`IGST @ ${GST_RATE}%`, inv.igstPaise, false]);
  else
    rows.push(
      [`CGST @ ${GST_RATE / 2}%`, inv.cgstPaise, false],
      [`SGST @ ${GST_RATE / 2}%`, inv.sgstPaise, false],
    );
  for (const [label, paise, bold] of rows) {
    text(page, bold ? f.bold : f.regular, label, labelX, y, {
      size: 9.5,
      align: "right",
    });
    text(
      page,
      bold ? f.bold : f.regular,
      `INR ${formatPaise(paise)}`,
      right - 8,
      y,
      {
        size: 9.5,
        align: "right",
      },
    );
    y += 17;
  }
  y += 4;
  rect(page, labelX - 110, y, right - labelX + 110, 24, MAROON);
  text(page, f.regular, "Total Amount Received", labelX, y + 7.5, {
    size: 10,
    align: "right",
    color: WHITE,
  });
  text(page, f.bold, `INR ${formatPaise(inv.totalPaise)}`, right - 8, y + 7.5, {
    size: 10,
    align: "right",
    color: WHITE,
  });
  y += 42;

  // Amount in words
  const wordsLabel = "Amount in words: ";
  text(page, f.regular, wordsLabel, M, y, { size: 10, color: MUTED });
  y = text(
    page,
    f.bold,
    amountInWords(inv.totalPaise),
    M + f.regular.widthOfTextAtSize(wordsLabel, 10),
    y,
    { size: 10, maxWidth: A4.w - 2 * M - 90 },
  );

  // Signatory
  y += 28;
  text(page, f.regular, `For ${s.tradeName}`, right, y, { align: "right" });
  hline(page, y + 52, right - 150, right);
  text(page, f.regular, "Authorised Signatory", right, y + 57, {
    align: "right",
    color: MUTED,
  });
  y += 90;

  // Notes
  hline(page, y);
  y += 10;
  y = text(
    page,
    f.regular,
    "This is a computer generated invoice. Whether the tax is payable on reverse charge basis - No.",
    M,
    y,
    { size: 8, color: MUTED, maxWidth: A4.w - 2 * M },
  );

  // Footer
  const fy = A4.h - 62;
  text(page, f.bold, "THANK YOU FOR YOUR BUSINESS", A4.w / 2, fy, {
    size: 9,
    align: "center",
  });
  hline(page, fy + 18);
  text(
    page,
    f.regular,
    `${s.tradeName} · ${s.addressLines.join(" ")}`,
    A4.w / 2,
    fy + 24,
    { size: 7.5, align: "center", color: MUTED },
  );
  text(
    page,
    f.regular,
    [
      `GSTIN: ${s.gstin}`,
      s.phone && `Phone: ${s.phone}`,
      s.email && `Email: ${s.email}`,
    ]
      .filter(Boolean)
      .join(" · "),
    A4.w / 2,
    fy + 35,
    { size: 7.5, align: "center", color: MUTED },
  );
  rect(page, 0, A4.h - 4, A4.w, 4, MAROON);

  if (inv.status === "cancelled") {
    const label = "CANCELLED";
    const size = 80;
    const w = f.bold.widthOfTextAtSize(label, size);
    page.drawText(label, {
      x: A4.w / 2 - (w / 2) * Math.cos(Math.PI / 6),
      y: A4.h / 2 - (w / 2) * Math.sin(Math.PI / 6),
      size,
      font: f.bold,
      color: rgb(0.85, 0.15, 0.15),
      opacity: 0.18,
      rotate: degrees(30),
    });
  }

  return doc.save();
}
