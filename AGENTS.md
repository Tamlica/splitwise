# AGENTS.md

## Project Overview
Vite + React 18 + TypeScript SPA for splitting restaurant bills. Uses Supabase for persistence.
Template: `bolt-vite-react-ts`.

## Commands
- `npm run dev` — start dev server (Vite)
- `npm run build` — production build to `dist/`
- `npm run lint` — ESLint (flat config, `eslint.config.js`)
- `npm run preview` — preview production build

No test runner is configured. No typecheck script exists; use `npx tsc --noEmit` if needed.

## Environment
Copy `.env.example` to `.env` and set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

App throws at startup if these are missing (`src/lib/supabase.ts`).

## Architecture
- **Entry**: `src/main.tsx` → wraps `<App />` in `<BrowserRouter>`.
- **Routes** (`src/App.tsx`):
  - `/` — main bill calculator (PeopleSection, DiscountsSection, FeesSection, Summary)
  - `/history` — list of saved bills (`RecentBillsList`)
  - `/bill/:billId` — single bill detail view (`BillDetails`)
- **State**: all bill state lives in `App.tsx` via `useState`, passed down as props. No global store.
- **Types**: `src/types.ts` — core domain types (Person, FoodItem, Discount, Fee, SavedBill, etc.)
- **Calculations**: `src/utils/calculations.ts` — `calculateFinalAmounts()` applies discounts/fees, splits equally or by food items. Final amounts are rounded up to nearest thousand (`src/utils/formatters.ts`).
- **Supabase**: `src/lib/supabase.ts` creates the client. All DB ops in `src/utils/supabaseOperations.ts`.
- **Exports**: `src/utils/exportToPDF.ts`, `src/utils/exportToCSV.ts`, `src/utils/clipboardUtils.ts`.

## Database Schema
Tables (see `supabase/migrations/`):
- `bills` — top-level bill records
- `bill_people` — per-person breakdown, linked to `bills`
- `bill_food_items` — individual food items, linked to `bill_people`
- `bill_discounts` — discounts applied to a bill
- `bill_fees` — fees applied to a bill

All inserts happen in `saveBill()` — order matters: bill → people → food items → discounts → fees.

## Styling
Tailwind CSS v3 with custom color palette: `teal`, `purple`, `orange` (all shades 50–950). Font: Inter.

## Conventions / Quirks
- No test framework — do not add tests unless asked.
- ESLint flat config (`eslint.config.js`), not `.eslintrc`.
- `lucide-react` is excluded from Vite's `optimizeDeps` — do not remove this without reason.
- Currency rounding: `roundUpToThousand()` in `formatters.ts` — amounts round up to nearest 1000 (IDR-style).
- Fees are split equally among all people; discounts are split proportionally by each person's share.
