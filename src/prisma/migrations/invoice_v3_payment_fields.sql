-- ============================================================
-- Invoice System v3 - Add payment fields (cheque_date, bank_name)
-- Run this AFTER invoice_v2_tables.sql
-- ============================================================

ALTER TABLE `payments`
  ADD COLUMN `cheque_date` DATE NULL AFTER `transaction_no`,
  ADD COLUMN `bank_name` VARCHAR(100) NULL AFTER `cheque_date`;
