import { ParsedOrder } from './types';

/** Checks that the parsed items, discounts and fees add up to the totals shown in the screenshot. */
export function reconcile(order: Omit<ParsedOrder, 'warnings'>): string[] {
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
