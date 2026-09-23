import { OcrRow, OrderParser, ParsedAdjustment, ParsedOrder, ParsedPerson } from '../types';

// "Rp27.000", "-Rp7.280", tolerant of OCR reading "RP", "Rp27,000" or O/l/S for digits.
const PRICE_PATTERN = /R[pP]\s?([0-9OoIlS][0-9OoIlS.,]*)/g;

export function parseIdr(raw: string): number {
  const digits = raw.replace(/[Oo]/g, '0').replace(/[Il]/g, '1').replace(/S/g, '5').replace(/[.,]/g, '');
  return parseInt(digits, 10);
}

function findPrices(text: string): number[] {
  return [...text.matchAll(PRICE_PATTERN)].map((m) => parseIdr(m[1])).filter((n) => !Number.isNaN(n));
}

function stripPrices(text: string): string {
  return text.replace(/-?\s*R[pP]\s?[0-9OoIlS][0-9OoIlS.,]*/g, '').trim();
}

const isNoise = (token: string) => token.replace(/[^a-zA-Z0-9]/g, '').length < 2;

function cleanUsername(text: string): string {
  let tokens = text.split(/\s+/).filter(Boolean);
  const hostAt = tokens.findIndex((t) => /^host$/i.test(t));
  if (hostAt >= 0) tokens = tokens.slice(0, hostAt);
  while (tokens.length > 1 && isNoise(tokens[0])) tokens.shift();
  while (tokens.length > 1 && isNoise(tokens[tokens.length - 1])) tokens.pop();
  return tokens.join(' ');
}

function cleanLabel(text: string): string {
  const tokens = text.split(/\s+/).filter(Boolean);
  while (tokens.length > 0 && isNoise(tokens[0])) tokens.shift();
  while (tokens.length > 0 && isNoise(tokens[tokens.length - 1])) tokens.pop();
  return tokens.join(' ');
}

const GAP_FACTOR = 2;
const SHORT_NOISE_LENGTH = 3;

/**
 * Item rows start with a product thumbnail whose caption/edges OCR reads as a short junk word
 * far to the left of the real name. Drop leading short words that sit across a large gap.
 */
function rowText(row: OcrRow): string {
  const words = [...row.words];
  while (words.length > 2) {
    const [first, next] = words;
    const gap = next.x0 - first.x1;
    const short = first.text.replace(/[^a-zA-Z0-9]/g, '').length <= SHORT_NOISE_LENGTH;
    const remainingHasName = words.slice(1).some((w) => !/^-?R[pP]/.test(w.text));
    if (short && gap > GAP_FACTOR * (next.y1 - next.y0) && remainingHasName) words.shift();
    else break;
  }
  return words.map((w) => w.text).join(' ');
}

const SUBTOTAL = /subtotal/i;
const DISCOUNT = /diskon|voucher|potongan|hemat/i;
const FEE = /biaya|pajak|ongkir|pengiriman|layanan|tip\b/i;
const NOTE = /catatan/i;
const QTY = /^[x×]\s?\d+$/i;
const ITEMS_END = /lihat\s+(lebih|less)/i;

function itemsSection(rows: OcrRow[], subtotalAt: number): OcrRow[] {
  let start = -1;
  for (let i = 0; i < subtotalAt; i++) {
    if (/rincian\s+pesanan/i.test(rows[i].text)) start = i;
  }
  let end = subtotalAt;
  for (let i = start + 1; i < subtotalAt; i++) {
    if (ITEMS_END.test(rows[i].text)) {
      end = i;
      break;
    }
  }
  return rows.slice(start + 1, end);
}

function parsePeople(rows: OcrRow[]): ParsedPerson[] {
  const people: ParsedPerson[] = [];
  let current: ParsedPerson | null = null;

  for (const row of rows) {
    const text = rowText(row).trim();
    const prices = findPrices(text);

    if (prices.length > 0) {
      const name = cleanLabel(stripPrices(text));
      if (!current) {
        current = { username: '', items: [] };
        people.push(current);
      }
      current.items.push({ name, price: prices[prices.length - 1] });
    } else if (NOTE.test(text)) {
      const item = current?.items[current.items.length - 1];
      const note = text.replace(/^.*?catatan\s+tambahan\s*:?/i, '').trim();
      if (item && note) item.name = `${item.name} (${note})`;
    } else if (QTY.test(text)) {
      continue; // quantity marker; the listed price is already the line total
    } else {
      const username = cleanUsername(text);
      if (username && !isNoise(username)) {
        current = { username, items: [] };
        people.push(current);
      }
    }
  }
  return people.filter((p) => p.items.length > 0);
}

function parseSummary(rows: OcrRow[]) {
  const discounts: ParsedAdjustment[] = [];
  const fees: ParsedAdjustment[] = [];
  let subtotal: number | null = null;
  let total: number | null = null;

  for (const row of rows) {
    const prices = findPrices(row.text);
    if (prices.length === 0) continue;
    const label = cleanLabel(stripPrices(row.text));
    // A struck-through original followed by the real amount ("Rp3.500 Rp0"): the last one wins.
    const amount = prices[prices.length - 1];

    if (SUBTOTAL.test(label)) {
      subtotal = amount;
    } else if (DISCOUNT.test(label)) {
      if (amount > 0) discounts.push({ name: label, amount });
    } else if (FEE.test(label)) {
      if (amount > 0) fees.push({ name: label, amount });
    } else {
      total = amount; // the unlabeled big figure at the bottom; the last one wins
    }
  }
  return { discounts, fees, subtotal, total };
}

function reconcile(order: Omit<ParsedOrder, 'warnings'>): string[] {
  const warnings: string[] = [];
  const itemsSum = order.people.reduce((s, p) => s + p.items.reduce((t, i) => t + i.price, 0), 0);
  const discountSum = order.discounts.reduce((s, d) => s + d.amount, 0);
  const feeSum = order.fees.reduce((s, f) => s + f.amount, 0);

  if (order.subtotal !== null && order.subtotal !== itemsSum) {
    warnings.push(`Items add up to ${itemsSum.toLocaleString('id-ID')} but the screenshot subtotal is ${order.subtotal.toLocaleString('id-ID')}.`);
  }
  if (order.total !== null && order.total !== itemsSum - discountSum + feeSum) {
    warnings.push(`Items − discounts + fees is ${(itemsSum - discountSum + feeSum).toLocaleString('id-ID')} but the screenshot total is ${order.total.toLocaleString('id-ID')}.`);
  }
  if (order.total === null) warnings.push('Could not read the total from the screenshot.');
  return warnings;
}

export const shopeeParser: OrderParser = {
  app: 'shopee',

  detect(rows) {
    const text = rows.map((r) => r.text).join('\n');
    return /rincian\s+pesanan/i.test(text) && SUBTOTAL.test(text);
  },

  parse(rows) {
    const subtotalAt = rows.findIndex((r) => SUBTOTAL.test(r.text));
    const people = parsePeople(itemsSection(rows, subtotalAt));
    const { discounts, fees, subtotal, total } = parseSummary(rows.slice(subtotalAt));

    const order = { app: 'shopee' as const, people, discounts, fees, subtotal, total };
    return { ...order, warnings: reconcile(order) };
  },
};
