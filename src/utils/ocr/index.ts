import { runOcr } from './runOcr';
import { shopeeParser } from './parsers/shopee';
import { OcrRow, OrderParser, ParsedOrder } from './types';

// To support another app (Gojek, Grab), add a parser file and register it here.
const PARSERS: OrderParser[] = [shopeeParser];

export function parseRows(rows: OcrRow[]): ParsedOrder {
  const parser = PARSERS.find((p) => p.detect(rows));
  if (!parser) {
    throw new Error('Unsupported screenshot. Only Shopee order details are recognised for now.');
  }
  const order = parser.parse(rows);
  if (order.people.length === 0) {
    throw new Error('Recognised the app but could not read any items. Try a sharper, uncropped screenshot.');
  }
  return order;
}

export async function parseScreenshot(file: File, onProgress?: (fraction: number) => void): Promise<ParsedOrder> {
  return parseRows(await runOcr(file, onProgress));
}
