import { OcrRow, OrderParser, ParsedAdjustment, ParsedPerson } from '../types';

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
// The app follows the phone's language, so every label exists in Indonesian and English.
const SECTION_START = /rincian\s+pesanan|item\s+details/i;
const DISCOUNT = /diskon|discount|voucher|potongan|hemat/i;
const FEE = /biaya|pajak|ongkir|pengiriman|layanan|\bfee\b|delivery|service|\btax\b|\btip\b/i;
const NOTE = /catatan|\bnote\s*:/i;
const NOTE_PREFIX = /^.*?(catatan\s+tambahan|note)\s*:?/i;
// "x1", optionally preceded by one short OCR junk token ("po x1").
const QTY = /^(\S{1,3}\s+)?[x×]\s?\d+$/i;
const ITEMS_END = /lihat\s+(lebih|less)|view\s+(less|more)/i;
const COLLAPSED = /lihat\s+lebih\s+banyak|view\s+more/i;

/** Rows holding the item list: from the last section heading (if any) up to `limit`. */
function itemsSection(rows: OcrRow[], limit: number): OcrRow[] {
  let start = -1;
  for (let i = 0; i < limit; i++) {
    if (SECTION_START.test(rows[i].text)) start = i;
  }
  let end = limit;
  for (let i = start + 1; i < limit; i++) {
    if (ITEMS_END.test(rows[i].text)) {
      end = i;
      break;
    }
  }
  return rows.slice(start + 1, end);
}

const MIN_USERNAME_LENGTH = 3;

/**
 * The username sits on the row directly above that person's first item. Everything else that
 * can precede an item row is noise: the "x N" quantity (often misread, so it must not be
 * relied on), shop/variant captions (upper-case), thumbnail junk (too short).
 */
function usernameAbove(rows: OcrRow[], index: number): string {
  if (index === 0) return '';
  const text = rowText(rows[index - 1]).trim();
  if (findPrices(text).length > 0 || NOTE.test(text) || QTY.test(text)) return '';
  const username = cleanUsername(text);
  const alnum = username.replace(/[^a-zA-Z0-9]/g, '');
  return alnum.length >= MIN_USERNAME_LENGTH && /[a-z0-9]/.test(username) ? username : '';
}

function parsePeople(rows: OcrRow[]): ParsedPerson[] {
  const people: ParsedPerson[] = [];
  let current: ParsedPerson | null = null;

  rows.forEach((row, i) => {
    const text = rowText(row).trim();
    const prices = findPrices(text);

    if (prices.length > 0) {
      const name = cleanLabel(stripPrices(text));
      if (!name) return; // the struck-through original price sits on its own row

      const username = usernameAbove(rows, i);
      if (username || !current) {
        current = { username, items: [] };
        people.push(current);
      }
      // The shown price comes first; a struck-through original, if on the same row, comes after.
      current.items.push({ name, price: prices[0] });
    } else if (NOTE.test(text)) {
      const item = current?.items[current.items.length - 1];
      const note = text.replace(NOTE_PREFIX, '').trim();
      if (item && note) item.name = `${item.name} (${note})`;
    }
  });
  return people;
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

const COLLAPSED_WARNING =
  'The item list looks collapsed ("View More"), so some items are missing. Expand it and screenshot again.';

export const shopeeParser: OrderParser = {
  app: 'shopee',

  detect(rows) {
    const text = rows.map((r) => r.text).join('\n');
    return SECTION_START.test(text) && SUBTOTAL.test(text);
  },

  /**
   * Also accepts one screenshot of a long order: the heading and the summary may each be
   * missing, and the first item may have no username row above it (it continues the previous
   * screenshot's last person).
   */
  parse(rows) {
    const subtotalAt = rows.findIndex((r) => SUBTOTAL.test(r.text));
    const people = parsePeople(itemsSection(rows, subtotalAt < 0 ? rows.length : subtotalAt));
    const summary = parseSummary(subtotalAt < 0 ? [] : rows.slice(subtotalAt));
    const collapsed = rows.some((r) => COLLAPSED.test(r.text));

    return {
      app: 'shopee',
      people,
      ...summary,
      warnings: collapsed ? [COLLAPSED_WARNING] : [],
    };
  },
};
