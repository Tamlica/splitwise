/*
  # Add telegram_thread_id to orders

  Supports posting order summaries into a specific Telegram forum topic
  (rather than the group's General thread). Mirrors how `group_chat_id`
  is already a single hardcoded value from splitwise's env — this is the
  same pattern, just for the topic thread within that group.

  Nullable: groups without Topics enabled, or orders meant for the
  General thread, simply omit it.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS telegram_thread_id bigint;
