-- AI Impact Maine — Payment Integration Migration
-- Adds Stripe Payment Link support and richer payment-method tracking to engagements.
--
-- Run each block one at a time in the D1 console.
-- These ALTER TABLE statements are NOT idempotent. If you've already run a block,
-- you'll see "duplicate column name" — that's safe to ignore. Move on to the next block.
--
-- This migration adds:
--   1. payment_link        — Stripe Payment Link URL (manually created in the Stripe dashboard)
--   2. payment_method      — How the client paid: 'stripe', 'check', 'ach', 'wire', 'other'
--   3. payment_reference   — Free-form reference: check number, ACH transaction ID, etc.

-- ===== BLOCK 1: Add payment_link =====
ALTER TABLE engagements ADD COLUMN payment_link TEXT;

-- ===== BLOCK 2: Add payment_method =====
ALTER TABLE engagements ADD COLUMN payment_method TEXT;

-- ===== BLOCK 3: Add payment_reference =====
ALTER TABLE engagements ADD COLUMN payment_reference TEXT;

-- ===== BLOCK 4: Verify =====
-- Run this to confirm the new columns are in place:
-- (you should see payment_link, payment_method, payment_reference among the rows)
SELECT name, type FROM pragma_table_info('engagements')
WHERE name IN ('payment_link', 'payment_method', 'payment_reference');
