-- ============================================================
-- Invoice System v2 - Unified Invoices + Separate Payments
-- Run this AFTER invoice_tables.sql
-- 
-- New tables:
--   1. invoices   - Unified invoice table with type column
--   2. payments   - Payment records against invoices
-- ============================================================

-- -----------------------------------------------------------
-- 1. Unified Invoices table (replaces ssc_invoices, assessor_invoices, tp_invoices)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoices` (
    `id`                    INT             NOT NULL AUTO_INCREMENT,
    `invoice_number`        VARCHAR(50)     NULL,
    `type`                  TINYINT         NOT NULL COMMENT '1=SSC, 2=Assessor, 3=TP',
    `batch_id`              INT             NOT NULL,
    `ssc_id`                INT             NULL,
    `scheme`                VARCHAR(255)    NULL,
    `assessor_id`           INT             NULL,
    `tp_id`                 INT             NULL,
    `assessment_date`       DATETIME        NULL,
    `total_candidate`       INT             NOT NULL,
    `present_candidate`     INT             NOT NULL,
    `amount_per_candidate`  DECIMAL(10,2)   NOT NULL,
    `total_amount`          DECIMAL(10,2)   NOT NULL,
    `advance_amount`        DECIMAL(10,2)   NULL DEFAULT 0.00,
    `tds_amount`            DECIMAL(10,2)   NULL DEFAULT 0.00,
    `other_deduction`       DECIMAL(10,2)   NULL DEFAULT 0.00,
    `net_amount`            DECIMAL(10,2)   NULL,
    `gst_amount`            DECIMAL(10,2)   NULL DEFAULT 0.00,
    `group_photo`           VARCHAR(500)    NULL,
    `attendance_sheet`      VARCHAR(500)    NULL,
    `invoice_pdf`           VARCHAR(500)    NULL,
    `signed_copy`           VARCHAR(500)    NULL,
    `status`                TINYINT         NOT NULL DEFAULT 1 COMMENT '0=draft,1=pending,2=approved,3=rejected,4=paid',
    `is_payment_complete`   TINYINT         NOT NULL DEFAULT 0 COMMENT '0=no,1=yes (manually set by agency)',
    `notes`                 TEXT            NULL,
    `agency_id`             INT             NOT NULL,
    `created_by`            INT             NOT NULL,
    `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_invoices_number` (`invoice_number`),
    INDEX `idx_invoices_type` (`type`),
    INDEX `idx_invoices_batch` (`batch_id`),
    INDEX `idx_invoices_ssc` (`ssc_id`),
    INDEX `idx_invoices_assessor` (`assessor_id`),
    INDEX `idx_invoices_tp` (`tp_id`),
    INDEX `idx_invoices_agency` (`agency_id`),
    INDEX `idx_invoices_status` (`status`),
    INDEX `idx_invoices_payment_complete` (`is_payment_complete`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 2. Payments table — tracks payment history per invoice
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
    `id`                INT             NOT NULL AUTO_INCREMENT,
    `invoice_id`        INT             NOT NULL,
    `amount`            DECIMAL(10,2)   NOT NULL,
    `payment_date`      DATE            NOT NULL,
    `payment_mode`      VARCHAR(50)     NULL COMMENT 'bank_transfer, cheque, cash, etc.',
    `transaction_no`    VARCHAR(100)    NULL,
    `transaction_slip`  VARCHAR(500)    NULL,
    `remarks`           TEXT            NULL,
    `created_by`        INT             NOT NULL,
    `created_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    INDEX `idx_payments_invoice` (`invoice_id`),
    INDEX `idx_payments_date` (`payment_date`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
