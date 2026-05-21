# Splitwise — Restaurant Bill Splitter

A web app for splitting restaurant bills among multiple people. Supports equal or per-item splits, discounts, fees, and saving bills to Supabase.

## Getting Started

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The app will throw at startup if these are not set.

### Database Setup

Run the migration in `supabase/migrations/` against your Supabase project to create the required tables: `bills`, `bill_people`, `bill_food_items`, `bill_discounts`, `bill_fees`.

## Development

```bash
npm run dev       # start dev server
npm run build     # production build → dist/
npm run preview   # preview production build
npm run lint      # ESLint
```

## Features

- **Equal or per-item split** — toggle between splitting the total equally or entering individual food items per person
- **Discounts & fees** — support for flat amounts and percentages
- **Save & history** — persist bills to Supabase and view past bills
- **Export** — export bills to PDF or CSV
- **Currency rounding** — amounts round up to the nearest 1000 (IDR-style)

## Stack

Vite · React 18 · TypeScript · Tailwind CSS · Supabase · lucide-react
