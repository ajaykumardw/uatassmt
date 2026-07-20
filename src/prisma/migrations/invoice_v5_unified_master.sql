-- ============================================================
-- Invoice System v5 - Unify invoice_master_data for all types
-- Adds type column & assessor/TP fields to invoice_master_data
-- Run this AFTER invoice_v4_remove_is_payment_complete.sql
-- ============================================================

ALTER TABLE `invoice_master_data`
  ADD COLUMN `type`                TINYINT         NOT NULL DEFAULT 1 COMMENT '1=SSC,2=Assessor,3=TP' AFTER `id`,
  ADD COLUMN `assessor_id`         INT             NULL AFTER `scheme_id`,
  ADD COLUMN `effective_from`      DATE            NULL AFTER `amount_per_candidate`,
  MODIFY COLUMN `ssc_id`          INT             NULL,
  MODIFY COLUMN `scheme_id`       INT             NULL,
  MODIFY COLUMN `scheme_name`     VARCHAR(255)    NULL,
  MODIFY COLUMN `amount_per_candidate` DECIMAL(10,2) NULL;
