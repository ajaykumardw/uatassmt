-- ============================================================
-- Invoice v6 - Add payment_receipt column to invoices table
-- Run this AFTER invoice_v5_unified_master.sql
-- ============================================================

ALTER TABLE `invoices`
  ADD COLUMN `payment_receipt` VARCHAR(500) NULL AFTER `signed_copy`;
