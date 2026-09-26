import { ParsedAdjustment, ParsedItem, ParsedOrder, ParsedPerson } from './types';

const normalizeUsername = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const itemKey = (item: ParsedItem) => `${item.name.toLowerCase().replace(/\s+/g, ' ')}|${item.price}`;
const adjustmentKey = (a: ParsedAdjustment) => `${a.name.toLowerCase().replace(/\s+/g, ' ')}|${a.amount}`;

interface Entry {
  person: ParsedPerson;
  /** Items that came from earlier screenshots; a repeat in a later one is scroll overlap. */
  earlier: Set<string>;
}

function mergeAdjustments(lists: ParsedAdjustment[][]): ParsedAdjustment[] {
  const seen = new Set<string>();
  const merged: ParsedAdjustment[] = [];
  for (const a of lists.flat()) {
    const key = adjustmentKey(a);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(a);
  }
  return merged;
}

/**
 * Combines orders parsed from consecutive screenshots of the same order, given in scroll order.
 * Screenshots overlap where the user scrolled less than a full screen, so an item that already
 * appeared under the same username in an earlier screenshot is dropped. Repeats inside a single
 * screenshot are kept. Items with no username start a screenshot mid-person: they belong to the
 * last person of the previous screenshot.
 */
export function mergeParsedOrders(orders: ParsedOrder[]): ParsedOrder {
  const people: ParsedPerson[] = [];
  const byUsername = new Map<string, Entry>();
  let last: Entry | null = null;

  for (const order of orders) {
    const addedThisOrder = new Map<Entry, string[]>();

    for (const parsed of order.people) {
      const key = normalizeUsername(parsed.username);
      let entry: Entry | null | undefined = key ? byUsername.get(key) : last;
      if (!entry) {
        entry = { person: { username: parsed.username, items: [] }, earlier: new Set() };
        people.push(entry.person);
        if (key) byUsername.set(key, entry);
      }
      last = entry;

      const added = addedThisOrder.get(entry) ?? [];
      for (const item of parsed.items) {
        const itemId = itemKey(item);
        if (entry.earlier.has(itemId)) continue;
        entry.person.items.push(item);
        added.push(itemId);
      }
      addedThisOrder.set(entry, added);
    }

    for (const [entry, keys] of addedThisOrder) keys.forEach((k) => entry.earlier.add(k));
  }

  return {
    app: orders[0].app,
    people,
    discounts: mergeAdjustments(orders.map((o) => o.discounts)),
    fees: mergeAdjustments(orders.map((o) => o.fees)),
    subtotal: orders.reduce<number | null>((acc, o) => o.subtotal ?? acc, null),
    total: orders.reduce<number | null>((acc, o) => o.total ?? acc, null),
    warnings: [...new Set(orders.flatMap((o) => o.warnings))],
  };
}
