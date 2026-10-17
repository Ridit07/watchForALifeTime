import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CustomerAddress, CustomerOrder } from "./shopify/customer";
import {
  amountInWords,
  invoiceConfig as cfg,
  invoiceNumber,
  stateCodeOf,
} from "./invoice-config";

/* A4 at 72dpi. */
const W = 595.28;
const H = 841.89;
const M = 28;
const INNER = W - M * 2;

const INK = rgb(0, 0, 0);
const LINE = rgb(0.35, 0.35, 0.35);

/**
 * The standard PDF fonts use WinAnsi, which has no rupee glyph — encoding one
 * throws. "Rs." is the usual substitute on Indian invoices.
 */
const RS = "Rs.";

function num(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

type Col = { key: string; label: string[]; w: number; align: "l" | "c" | "r" };

/** Line columns differ between a CGST+SGST bill and an IGST one. */
function columns(interState: boolean): Col[] {
  const base: Col[] = [
    { key: "sn", label: ["S.N."], w: 20, align: "l" },
    { key: "desc", label: ["Description of", "Goods"], w: 0, align: "l" },
    { key: "group", label: ["Item", "Group"], w: 42, align: "l" },
    { key: "hsn", label: ["HSN/SAC", "Code"], w: 46, align: "l" },
    { key: "qty", label: ["Qty."], w: 26, align: "r" },
    { key: "unit", label: ["Unit"], w: 22, align: "l" },
    { key: "list", label: ["List Price"], w: 46, align: "r" },
    { key: "disc", label: ["Disc./Unit"], w: 42, align: "r" },
    { key: "price", label: ["Price"], w: 44, align: "r" },
  ];

  const tax: Col[] = interState
    ? [
        { key: "igstR", label: ["IGST", "Rate"], w: 34, align: "r" },
        { key: "igstA", label: ["IGST", "Amount"], w: 46, align: "r" },
      ]
    : [
        { key: "cgstR", label: ["CGST", "Rate"], w: 30, align: "r" },
        { key: "cgstA", label: ["CGST", "Amount"], w: 38, align: "r" },
        { key: "sgstR", label: ["SGST", "Rate"], w: 30, align: "r" },
        { key: "sgstA", label: ["SGST", "Amount"], w: 38, align: "r" },
      ];

  const cols = [...base, ...tax, {
    key: "amt", label: [`Amount(${RS})`], w: 54, align: "r" as const,
  }];

  // Description absorbs whatever is left, so the grid always spans the page.
  const fixed = cols.reduce((s, c) => s + c.w, 0);
  cols.find((c) => c.key === "desc")!.w = INNER - fixed;

  return cols;
}

export async function renderInvoicePdf(
  order: CustomerOrder,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const f = await pdf.embedFont(StandardFonts.Helvetica);
  const b = await pdf.embedFont(StandardFonts.HelveticaBold);
  const i = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const bi = await pdf.embedFont(StandardFonts.HelveticaBoldOblique);

  const page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;

  // ---- primitives ---------------------------------------------------
  const txt = (
    s: string,
    x: number,
    yy: number,
    size = 8,
    font: PDFFont = f,
  ) => page.drawText(s, { x, y: yy, size, font, color: INK });

  const txtR = (s: string, right: number, yy: number, size = 8, font = f) =>
    page.drawText(s, {
      x: right - font.widthOfTextAtSize(s, size),
      y: yy,
      size,
      font,
      color: INK,
    });

  const txtC = (s: string, cx: number, yy: number, size = 8, font = f) =>
    page.drawText(s, {
      x: cx - font.widthOfTextAtSize(s, size) / 2,
      y: yy,
      size,
      font,
      color: INK,
    });

  const hLine = (yy: number, x1 = M, x2 = W - M) =>
    page.drawLine({
      start: { x: x1, y: yy },
      end: { x: x2, y: yy },
      thickness: 0.7,
      color: LINE,
    });

  const vLine = (x: number, y1: number, y2: number) =>
    page.drawLine({
      start: { x, y: y1 },
      end: { x, y: y2 },
      thickness: 0.7,
      color: LINE,
    });

  const wrap = (s: string, font: PDFFont, size: number, width: number) => {
    const out: string[] = [];
    let line = "";
    for (const word of s.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        out.push(line);
        line = word;
      } else line = next;
    }
    if (line) out.push(line);
    return out;
  };

  // ---- derived values ------------------------------------------------
  const shipState = order.shippingAddress?.province ?? null;
  const posCode = stateCodeOf(shipState) ?? cfg.stateCode;
  const posName = shipState || cfg.stateName;
  const interState = posCode !== cfg.stateCode;

  const rate = cfg.gstRate;
  const halfPct = `${((rate / 2) * 100).toFixed(2)} %`;
  const fullPct = `${(rate * 100).toFixed(2)} %`;

  const cols = columns(interState);
  const xOf: Record<string, { x: number; w: number }> = {};
  let cx = M;
  for (const c of cols) {
    xOf[c.key] = { x: cx, w: c.w };
    cx += c.w;
  }

  const grandTotal = Number(order.currentTotalPrice.amount);
  const taxable = grandTotal / (1 + rate);
  const totalTax = grandTotal - taxable;
  const totalQty = order.lineItems.reduce((s, l) => s + l.quantity, 0);

  // ---- header ---------------------------------------------------------
  const top = y;
  y -= 13;
  txt(`GSTIN :  ${cfg.gstin || "—"}`, M + 6, y, 9, b);
  txtR("Original Copy", W - M - 6, y, 8.5, i);

  y -= 15;
  txtC("TAX INVOICE", W / 2, y, 9.5, b);
  const tw = b.widthOfTextAtSize("TAX INVOICE", 9.5);
  hLine(y - 2, W / 2 - tw / 2, W / 2 + tw / 2);

  y -= 17;
  txtC(cfg.legalName, W / 2, y, 16, b);

  y -= 12;
  txtC(cfg.address, W / 2, y, 8.5);

  y -= 8;
  hLine(y);

  // ---- invoice meta / place of supply ---------------------------------
  const metaTop = y;
  const mid = M + INNER * 0.5;

  y -= 12;
  txt("Invoice No.", M + 6, y, 8.5);
  txt(":", M + 78, y, 8.5);
  txt(invoiceNumber(order.orderNumber, order.processedAt), M + 90, y, 8.5, b);
  txt("Place of Supply", mid + 6, y, 8.5);
  txt(":", mid + 90, y, 8.5);
  txt(`${posName} (${posCode})`, mid + 102, y, 8.5);

  y -= 12;
  const d = new Date(order.processedAt);
  const dd = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  txt("Dated", M + 6, y, 8.5);
  txt(":", M + 78, y, 8.5);
  txt(dd, M + 90, y, 8.5);
  txt("Reverse Charge", mid + 6, y, 8.5);
  txt(":", mid + 90, y, 8.5);
  txt("N", mid + 102, y, 8.5);

  y -= 6;
  hLine(y);
  vLine(mid, metaTop, y);

  // ---- billed / shipped ------------------------------------------------
  const partyTop = y;
  const name = (a: CustomerAddress | null) =>
    a ? [a.firstName, a.lastName].filter(Boolean).join(" ") : "";

  const partyBlock = (
    title: string,
    a: CustomerAddress | null,
    x: number,
    width: number,
  ) => {
    let yy = partyTop - 12;
    txt(title, x + 6, yy, 8.5, bi);
    yy -= 12;

    const lines = a
      ? [
          name(a),
          a.address1,
          a.address2,
          [a.city, a.province, a.zip].filter(Boolean).join(", "),
          a.country,
          a.phone,
        ].filter((l): l is string => Boolean(l && l.trim()))
      : [order.email || "—"];

    for (const l of lines) {
      for (const part of wrap(l, f, 8.5, width - 14)) {
        txt(part, x + 6, yy, 8.5);
        yy -= 10.5;
      }
    }
    return yy;
  };

  const leftEnd = partyBlock("Billed to   :", order.billingAddress, M, INNER / 2);
  const rightEnd = partyBlock(
    "Shipped to :",
    order.shippingAddress,
    mid,
    INNER / 2,
  );

  y = Math.min(leftEnd, rightEnd) - 6;
  txt("GSTIN / UIN", M + 6, y, 8.5);
  txt(":", M + 90, y, 8.5);
  txt("GSTIN / UIN", mid + 6, y, 8.5);
  txt(":", mid + 90, y, 8.5);

  y -= 8;
  hLine(y);
  vLine(mid, partyTop, y);

  // ---- items table header ---------------------------------------------
  const headTop = y;
  for (const c of cols) {
    const { x, w } = xOf[c.key];
    let yy = headTop - 11;
    for (const l of c.label) {
      if (c.align === "r") txtR(l, x + w - 3, yy, 6.8, b);
      else txt(l, x + 3, yy, 6.8, b);
      yy -= 8;
    }
  }
  y = headTop - (Math.max(...cols.map((c) => c.label.length)) * 8 + 6);
  hLine(y);
  const bodyTop = y;

  // ---- items ------------------------------------------------------------
  for (const [idx, item] of order.lineItems.entries()) {
    const lineTotal = Number(item.discountedTotalPrice.amount);
    const original = Number(item.originalTotalPrice.amount);
    const qty = item.quantity || 1;

    const listUnit = original / qty;
    const discUnit = Math.max(0, (original - lineTotal) / qty);
    const priceUnit = lineTotal / qty / (1 + rate);
    const lineTax = lineTotal - lineTotal / (1 + rate);

    const descLines = wrap(
      item.variant?.sku || item.title,
      f,
      7,
      xOf.desc.w - 6,
    ).slice(0, 2);

    const rowH = Math.max(14, descLines.length * 8 + 6);
    y -= 11;

    const cell = (key: string, value: string, font = f, size = 7) => {
      const { x, w } = xOf[key];
      const col = cols.find((c) => c.key === key)!;
      if (col.align === "r") txtR(value, x + w - 3, y, size, font);
      else txt(value, x + 3, y, size, font);
    };

    cell("sn", `${idx + 1}.`);
    cell("desc", descLines[0], f, 7);
    cell("group", (item.variant?.product?.vendor || "").toUpperCase() || "—");
    cell("hsn", cfg.defaultHsn);
    cell("qty", qty.toFixed(2));
    cell("unit", cfg.unit);
    cell("list", num(listUnit));
    cell("disc", num(discUnit));
    cell("price", num(priceUnit));

    if (interState) {
      cell("igstR", fullPct);
      cell("igstA", num(lineTax));
    } else {
      cell("cgstR", halfPct);
      cell("cgstA", num(lineTax / 2));
      cell("sgstR", halfPct);
      cell("sgstA", num(lineTax / 2));
    }
    cell("amt", num(lineTotal));

    let sub = y - 8;
    for (const l of descLines.slice(1)) {
      txt(l, xOf.desc.x + 3, sub, 7);
      sub -= 8;
    }
    y = Math.min(y, sub) - (rowH - 14) + 3;
  }

  // ---- table body fills the page, as on the showroom bill --------------
  const bodyBottom = M + 196;
  for (const c of cols) vLine(xOf[c.key].x, bodyTop, bodyBottom);
  vLine(W - M, bodyTop, bodyBottom);
  hLine(bodyBottom);

  // ---- grand total ------------------------------------------------------
  y = bodyBottom - 13;
  txtR("Grand Total", xOf.qty.x - 6, y, 8.5, b);
  txt(totalQty.toFixed(2), xOf.qty.x + 3, y, 8.5, b);
  txt(cfg.unit, xOf.unit.x + 3, y, 8.5, b);
  txt(RS, xOf.amt.x - 22, y, 8.5, b);
  txtR(num(grandTotal), W - M - 3, y, 8.5, b);

  y -= 7;
  hLine(y);
  vLine(xOf.amt.x - 30, bodyBottom, y);
  vLine(W - M, bodyBottom, y);

  // ---- tax summary ------------------------------------------------------
  y -= 12;
  const sumCols = interState
    ? ["Tax Rate", "Taxable Amt.", "IGST Amt.", "Total Tax"]
    : ["Tax Rate", "Taxable Amt.", "CGST Amt.", "SGST Amt.", "Total Tax"];
  const sumVals = interState
    ? [fullPct, num(taxable), num(totalTax), num(totalTax)]
    : [
        `${(rate * 100).toFixed(0)}%`,
        num(taxable),
        num(totalTax / 2),
        num(totalTax / 2),
        num(totalTax),
      ];

  let sx = M + 6;
  const colW = 78;
  for (const [n, label] of sumCols.entries()) {
    txt(label, sx, y, 7.5, b);
    txt(sumVals[n], sx, y - 11, 7.5);
    sx += n === 0 ? 56 : colW;
  }

  y -= 24;
  txt(amountInWords(grandTotal), M, y, 9, b);

  y -= 8;
  hLine(y);

  // ---- terms / signature -------------------------------------------------
  const footTop = y;
  const fmid = M + INNER * 0.44;

  let ty = footTop - 12;
  txt("Terms & Conditions", M + 6, ty, 7.5, b);
  hLine(ty - 2, M + 6, M + 6 + b.widthOfTextAtSize("Terms & Conditions", 7.5));
  ty -= 12;
  for (const term of cfg.terms) {
    for (const l of wrap(term, f, 7.5, INNER * 0.44 - 14)) {
      txt(l, M + 6, ty, 7.5);
      ty -= 9.5;
    }
  }

  txt("Receiver's Signature   :", fmid + 6, footTop - 12, 7.5, b);
  hLine(footTop - 22, fmid, W - M);
  txtR(`for ${cfg.legalName}`, W - M - 8, footTop - 56, 9, b);
  txtR("Authorised Signatory", W - M - 8, footTop - 80, 9, b);

  const footBottom = Math.min(ty - 4, footTop - 92);
  hLine(footBottom);
  vLine(fmid, footTop, footBottom);

  // ---- outer frame ---------------------------------------------------------
  vLine(M, top, footBottom);
  vLine(W - M, top, footBottom);
  hLine(top);

  return pdf.save();
}
