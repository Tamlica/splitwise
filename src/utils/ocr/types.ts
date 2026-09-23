export type OrderApp = 'shopee' | 'gojek' | 'grab';

export interface OcrWord {
  text: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Words that share a visual row, ordered left to right. */
export interface OcrRow {
  text: string;
  words: OcrWord[];
}

export interface ParsedItem {
  name: string;
  price: number;
}

export interface ParsedPerson {
  username: string;
  items: ParsedItem[];
}

export interface ParsedAdjustment {
  name: string;
  amount: number;
}

export interface ParsedOrder {
  app: OrderApp;
  people: ParsedPerson[];
  discounts: ParsedAdjustment[];
  fees: ParsedAdjustment[];
  subtotal: number | null;
  total: number | null;
  warnings: string[];
}

export interface OrderParser {
  app: OrderApp;
  detect(rows: OcrRow[]): boolean;
  parse(rows: OcrRow[]): ParsedOrder;
}
