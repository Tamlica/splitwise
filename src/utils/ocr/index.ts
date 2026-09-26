import { runOcrBatch } from './runOcr';
import { mergeParsedOrders } from './mergeOrders';
import { reconcile } from './reconcile';
import { shopeeParser } from './parsers/shopee';
import { OcrRow, OrderParser, ParsedOrder } from './types';

// To support another app (Gojek, Grab), add a parser file and register it here.
const PARSERS: OrderParser[] = [shopeeParser];

/** `rowsPerScreenshot` is in scroll order: one entry per screenshot of the same order. */
export function parseScreenshotRows(rowsPerScreenshot: OcrRow[][]): ParsedOrder {
  // A middle screenshot of a long list has neither the heading nor the totals, so detect the
  // app from all of them together.
  const everything = rowsPerScreenshot.flat();
  const parser = PARSERS.find((p) => p.detect(everything));
  if (!parser) {
    throw new Error('Unsupported screenshot. Only Shopee order details are recognised for now.');
  }

  const parsed = rowsPerScreenshot.map((rows) => parser.parse(rows));
  const merged = mergeParsedOrders(parsed);
  if (merged.people.length === 0) {
    throw new Error('Recognised the app but could not read any items. Try a sharper, uncropped screenshot.');
  }

  const warnings = [...merged.warnings];
  if (parsed.length > 1) {
    parsed.forEach((order, i) => {
      const empty = order.people.length === 0 && order.subtotal === null && order.total === null;
      if (empty) warnings.push(`Screenshot ${i + 1} had nothing readable in it.`);
    });
  }
  return { ...merged, warnings: [...warnings, ...reconcile(merged)] };
}

export async function parseScreenshots(
  files: File[],
  onProgress?: (fileIndex: number, fraction: number) => void
): Promise<ParsedOrder> {
  return parseScreenshotRows(await runOcrBatch(files, onProgress));
}
