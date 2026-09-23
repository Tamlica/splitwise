import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import { Discount, Fee, Member, Person } from '../types';
import { parseScreenshot } from '../utils/ocr';
import { matchMember } from '../utils/ocr/matchMembers';
import { OrderApp } from '../utils/ocr/types';

export interface ImportResult {
  people: Person[];
  discounts: Discount[];
  fees: Fee[];
}

interface ImportScreenshotModalProps {
  members: Member[];
  onClose: () => void;
  onApply: (result: ImportResult) => void;
}

interface DraftItem {
  key: string;
  name: string;
  price: string;
}

interface DraftPerson {
  key: string;
  username: string;
  memberId: string;
  needsCheck: boolean;
  items: DraftItem[];
}

interface DraftAdjustment {
  key: string;
  name: string;
  amount: string;
}

interface Draft {
  app: OrderApp;
  people: DraftPerson[];
  discounts: DraftAdjustment[];
  fees: DraftAdjustment[];
  warnings: string[];
}

let keyCounter = 0;
const nextKey = () => `k${++keyCounter}`;

const inputClass =
  'p-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500';

const ImportScreenshotModal = ({ members, onClose, onApply }: ImportScreenshotModalProps) => {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || busy) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setError('');
    setBusy(true);
    setProgress(0);
    try {
      const order = await parseScreenshot(file, setProgress);
      setDraft({
        app: order.app,
        warnings: order.warnings,
        people: order.people.map((p) => {
          const match = matchMember(p.username, members, order.app);
          return {
            key: nextKey(),
            username: p.username,
            memberId: match?.member.id ?? '',
            needsCheck: !!match && !match.exact,
            items: p.items.map((i) => ({ key: nextKey(), name: i.name, price: String(i.price) })),
          };
        }),
        discounts: order.discounts.map((d) => ({ key: nextKey(), name: d.name, amount: String(d.amount) })),
        fees: order.fees.map((f) => ({ key: nextKey(), name: f.name, amount: String(f.amount) })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read the screenshot.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (file) void handleFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  const updateDraft = (fn: (d: Draft) => Draft) => setDraft((d) => (d ? fn(d) : d));

  const updatePerson = (key: string, patch: Partial<DraftPerson>) =>
    updateDraft((d) => ({
      ...d,
      people: d.people.map((p) => (p.key === key ? { ...p, ...patch } : p)),
    }));

  const updateItem = (personKey: string, itemKey: string, patch: Partial<DraftItem>) =>
    updateDraft((d) => ({
      ...d,
      people: d.people.map((p) =>
        p.key === personKey
          ? { ...p, items: p.items.map((i) => (i.key === itemKey ? { ...i, ...patch } : i)) }
          : p
      ),
    }));

  const removeItem = (personKey: string, itemKey: string) =>
    updateDraft((d) => ({
      ...d,
      people: d.people.map((p) =>
        p.key === personKey ? { ...p, items: p.items.filter((i) => i.key !== itemKey) } : p
      ),
    }));

  const updateAdjustment = (kind: 'discounts' | 'fees', key: string, patch: Partial<DraftAdjustment>) =>
    updateDraft((d) => ({ ...d, [kind]: d[kind].map((a) => (a.key === key ? { ...a, ...patch } : a)) }));

  const removeAdjustment = (kind: 'discounts' | 'fees', key: string) =>
    updateDraft((d) => ({ ...d, [kind]: d[kind].filter((a) => a.key !== key) }));

  const allMapped = !!draft && draft.people.length > 0 && draft.people.every((p) => p.memberId);

  const handleApply = () => {
    if (!draft || !allMapped) return;
    const stamp = Date.now();

    // Two screenshot users mapped to one member become a single person.
    const byMember = new Map<string, Person>();
    draft.people.forEach((p, pi) => {
      const member = members.find((m) => m.id === p.memberId);
      if (!member) return;
      const foods = p.items
        .map((item, ii) => ({ id: `${stamp}-${pi}-${ii}`, name: item.name.trim(), price: Number(item.price) }))
        .filter((food) => food.name && food.price > 0);
      const existing = byMember.get(member.id);
      if (existing) existing.foods.push(...foods);
      else byMember.set(member.id, { id: `${stamp}-${pi}`, name: member.name, amount: 0, foods });
    });

    const toAdjustments = (rows: DraftAdjustment[], prefix: string) =>
      rows
        .filter((r) => r.name.trim() && Number(r.amount) > 0)
        .map((r, i) => ({ id: `${stamp}-${prefix}${i}`, name: r.name.trim(), amount: Number(r.amount), isPercentage: false }));

    onApply({
      people: [...byMember.values()],
      discounts: toAdjustments(draft.discounts, 'd'),
      fees: toAdjustments(draft.fees, 'f'),
    });
  };

  const renderAdjustments = (kind: 'discounts' | 'fees', title: string) => {
    const rows = draft?.[kind] ?? [];
    if (rows.length === 0) return null;
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.key} className="flex gap-2">
              <input
                value={row.name}
                onChange={(e) => updateAdjustment(kind, row.key, { name: e.target.value })}
                className={`${inputClass} flex-1`}
              />
              <input
                type="number"
                value={row.amount}
                onChange={(e) => updateAdjustment(kind, row.key, { amount: e.target.value })}
                className={`${inputClass} w-28`}
              />
              <button onClick={() => removeAdjustment(kind, row.key)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Import from screenshot</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {!draft && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => !busy && fileInput.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-teal-400"
            >
              {busy ? (
                <div className="flex flex-col items-center gap-2 text-gray-600">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Reading screenshot… {Math.round(progress * 100)}%</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-600">
                  <ImagePlus className="h-6 w-6" />
                  <span>Drop, paste or click to choose a Shopee order-detail screenshot</span>
                </div>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {draft && (
            <>
              {draft.warnings.length > 0 && (
                <div className="flex gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    {draft.warnings.map((w) => (
                      <p key={w}>{w}</p>
                    ))}
                    <p className="mt-1">Check the numbers below against your screenshot before applying.</p>
                  </div>
                </div>
              )}

              {draft.people.map((person) => (
                <div key={person.key} className="p-3 bg-gray-50 rounded-md space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 shrink-0">@{person.username || '?'}</span>
                    <select
                      value={person.memberId}
                      onChange={(e) => updatePerson(person.key, { memberId: e.target.value, needsCheck: false })}
                      className={`${inputClass} flex-1 ${person.memberId ? '' : 'border-red-400'}`}
                    >
                      <option value="">Choose member…</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    {person.needsCheck && <span className="text-xs text-amber-700 shrink-0">check match</span>}
                  </div>
                  {person.items.map((item) => (
                    <div key={item.key} className="flex gap-2">
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(person.key, item.key, { name: e.target.value })}
                        className={`${inputClass} flex-1`}
                      />
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(person.key, item.key, { price: e.target.value })}
                        className={`${inputClass} w-28`}
                      />
                      <button
                        onClick={() => removeItem(person.key, item.key)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ))}

              {renderAdjustments('discounts', 'Discounts')}
              {renderAdjustments('fees', 'Fees')}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
          {draft && (
            <button
              onClick={() => setDraft(null)}
              className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              Choose another
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!allMapped}
            title={draft && !allMapped ? 'Choose a member for every person first' : undefined}
            className="px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply to bill
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportScreenshotModal;
