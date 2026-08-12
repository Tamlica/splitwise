/*
  # Lunch-Bill Tracker: members / orders / order_items

  New, separate schema for the Telegram lunch-bill bot integration
  (splitwise-telebot). Lives alongside the existing bills/bill_people/
  bill_food_items/bill_discounts/bill_fees tables, which are untouched.

  1. New Tables
    - `members`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `telegram_username` (text, optional — only used for @mentions)
      - `active` (boolean)
      - `created_at` (timestamptz)
    - `orders`
      - `id` (uuid, primary key)
      - `group_chat_id` (text)
      - `location` (text)
      - `order_date` (date)
      - `payer_id` (uuid, references members)
      - `telegram_message_id` (bigint, filled in by the bot after posting)
      - `created_at` (timestamptz)
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `member_id` (uuid, references members)
      - `food` (text)
      - `original_amount` (integer)
      - `final_amount` (integer)
      - `settled` (boolean)
      - `settled_at` (timestamptz)

  2. Security
    - Enable RLS on all three tables.
    - `anon` (splitwise, client-side, no auth) gets:
      - members: select/insert/update (Task 3.1 members management UI
        lives entirely in the frontend, no backend, so it needs to be
        able to add and deactivate members directly)
      - orders: select/insert (so it can create an order and read back
        the inserted row's id/timestamp)
      - order_items: select/insert (same reason) but NOT update — the
        bot (service-role key, bypasses RLS) is the only writer of
        `settled`/`settled_at`, per the plan.
    - No delete policies anywhere (soft-delete via `members.active` only).
    - splitwise-telebot uses the service-role key, which bypasses RLS
      entirely, so it needs no explicit policies here.
*/

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  telegram_username text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id text NOT NULL,
  location text NOT NULL,
  order_date date NOT NULL DEFAULT current_date,
  payer_id uuid NOT NULL REFERENCES members(id),
  telegram_message_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id),
  food text NOT NULL,
  original_amount integer NOT NULL,
  final_amount integer NOT NULL,
  settled boolean NOT NULL DEFAULT false,
  settled_at timestamptz
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_member_id_idx ON order_items(member_id);
CREATE INDEX IF NOT EXISTS orders_payer_id_idx ON orders(payer_id);
CREATE INDEX IF NOT EXISTS orders_group_chat_id_idx ON orders(group_chat_id);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- members: anon can read, add, and deactivate/edit (frontend has no backend)
CREATE POLICY "Public read access to members"
  ON members FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public insert access to members"
  ON members FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public update access to members"
  ON members FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- orders: anon can read and create, never update (telegram_message_id is bot-only)
CREATE POLICY "Public read access to orders"
  ON orders FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public insert access to orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

-- order_items: anon can read and create, never update (settled is bot-only)
CREATE POLICY "Public read access to order_items"
  ON order_items FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public insert access to order_items"
  ON order_items FOR INSERT
  TO anon
  WITH CHECK (true);
