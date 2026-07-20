-- ============================================================
-- Invoice System v4 - Remove is_payment_complete column
-- Status 4 (Paid) is now the indicator
-- Run this AFTER invoice_v3_payment_fields.sql
-- ============================================================

ALTER TABLE `invoices`
  DROP COLUMN `is_payment_complete`,
  DROP INDEX `idx_invoices_payment_complete`;
