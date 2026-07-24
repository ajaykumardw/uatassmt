-- ============================================================
-- Invoice v7 - Add deduction columns to payments table
-- Allows agency to record TDS/Advance/Other deductions per payment
-- Run this AFTER invoice_v6_add_payment_receipt.sql
-- ============================================================

ALTER TABLE `payments`
  ADD COLUMN `tds_amount`      DECIMAL(10,2) NULL DEFAULT 0.00 AFTER `amount`,
  ADD COLUMN `advance_amount`  DECIMAL(10,2) NULL DEFAULT 0.00 AFTER `tds_amount`,
  ADD COLUMN `other_deduction` DECIMAL(10,2) NULL DEFAULT 0.00 AFTER `advance_amount`;
