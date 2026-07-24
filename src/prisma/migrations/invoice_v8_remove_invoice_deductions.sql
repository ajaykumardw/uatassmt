-- ============================================================
-- Invoice v8 - Remove deduction columns from invoices table
-- Deductions now only tracked via payments table
-- Run this AFTER invoice_v7_payment_deductions.sql
-- ============================================================

ALTER TABLE `invoices`
  DROP COLUMN `advance_amount`,
  DROP COLUMN `tds_amount`,
  DROP COLUMN `other_deduction`,
  DROP COLUMN `net_amount`;
