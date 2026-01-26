/*
  # Create Bills Schema

  1. New Tables
    - `bills`
      - `id` (uuid, primary key)
      - `restaurant_name` (text)
      - `total_original` (numeric)
      - `total_discount` (numeric)
      - `total_fee` (numeric)
      - `grand_total` (numeric)
      - `is_equal_split` (boolean)
      - `created_at` (timestamp)
    - `bill_people`
      - `id` (uuid, primary key)
      - `bill_id` (uuid, foreign key)
      - `name` (text)
      - `original_amount` (numeric)
      - `discount_amount` (numeric)
      - `fee_amount` (numeric)
      - `final_amount` (numeric)
      - `is_paid` (boolean)
    - `bill_food_items`
      - `id` (uuid, primary key)
      - `bill_person_id` (uuid, foreign key)
      - `name` (text)
      - `price` (numeric)
    - `bill_discounts`
      - `id` (uuid, primary key)
      - `bill_id` (uuid, foreign key)
      - `name` (text)
      - `amount` (numeric)
      - `is_percentage` (boolean)
    - `bill_fees`
      - `id` (uuid, primary key)
      - `bill_id` (uuid, foreign key)
      - `name` (text)
      - `amount` (numeric)
      - `is_percentage` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since no auth is implemented yet)
*/

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name text DEFAULT '',
  total_original numeric DEFAULT 0,
  total_discount numeric DEFAULT 0,
  total_fee numeric DEFAULT 0,
  grand_total numeric DEFAULT 0,
  is_equal_split boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create bill_people table
CREATE TABLE IF NOT EXISTS bill_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid REFERENCES bills(id) ON DELETE CASCADE,
  name text NOT NULL,
  original_amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  fee_amount numeric DEFAULT 0,
  final_amount numeric DEFAULT 0,
  is_paid boolean DEFAULT false
);

-- Create bill_food_items table
CREATE TABLE IF NOT EXISTS bill_food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_person_id uuid REFERENCES bill_people(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric DEFAULT 0
);

-- Create bill_discounts table
CREATE TABLE IF NOT EXISTS bill_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid REFERENCES bills(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric DEFAULT 0,
  is_percentage boolean DEFAULT false
);

-- Create bill_fees table
CREATE TABLE IF NOT EXISTS bill_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid REFERENCES bills(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric DEFAULT 0,
  is_percentage boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_fees ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
CREATE POLICY "Public access to bills"
  ON bills
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access to bill_people"
  ON bill_people
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access to bill_food_items"
  ON bill_food_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access to bill_discounts"
  ON bill_discounts
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public access to bill_fees"
  ON bill_fees
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);