/*
  # Remove Telegram integration

  The Telegram bot (splitwise-telebot) has been retired. Settlement is now
  tracked directly from the splitwise frontend.

  1. members
    - Drop `telegram_username`
    - Add optional `shopee_username`, `gojek_username`, `grab_username`
  2. orders
    - Drop `group_chat_id`, `telegram_message_id`, `telegram_thread_id`
      (and the `orders_group_chat_id_idx` index)
  3. Security
    - `anon` can now update `order_items` so the frontend can toggle
      `settled`/`settled_at` (previously bot-only via service-role key).
*/

ALTER TABLE members DROP COLUMN IF EXISTS telegram_username;
ALTER TABLE members ADD COLUMN IF NOT EXISTS shopee_username text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS gojek_username text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS grab_username text;

DROP INDEX IF EXISTS orders_group_chat_id_idx;
ALTER TABLE orders DROP COLUMN IF EXISTS group_chat_id;
ALTER TABLE orders DROP COLUMN IF EXISTS telegram_message_id;
ALTER TABLE orders DROP COLUMN IF EXISTS telegram_thread_id;

CREATE POLICY "Public update access to order_items"
  ON order_items FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
