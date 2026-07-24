-- ============================================================
-- Invoice System v9 - Add gst_percentage column
-- Replaces gst_amount with gst_percentage for TP invoices
-- Run this AFTER invoice_v8_remove_invoice_deductions.sql
-- ============================================================

ALTER TABLE `invoices`
  ADD COLUMN `gst_percentage` DECIMAL(5,2) NULL DEFAULT NULL AFTER `gst_amount`;
