-- ============================================================
-- Invoice System - Database Migration
-- Run this on production DB after pulling the code
-- 
-- Tables:
--   1. invoice_master_data      - SSC wise scheme amount per candidate
--   2. assessor_invoice_amounts - Assessor per-candidate rates
--   3. tp_invoice_amounts       - Training partner per-candidate rates
--   4. ssc_invoices             - SSC assessment invoices
--   5. assessor_invoices        - Assessor/proctor invoices with workflow
--   6. tp_invoices              - Training partner invoices
-- ============================================================

-- -----------------------------------------------------------
-- 1. Invoice Master Data — SSC wise scheme amount per candidate
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `invoice_master_data` (
    `id`                    INT             NOT NULL AUTO_INCREMENT,
    `ssc_id`                INT             NOT NULL,
    `scheme_id`             INT             NOT NULL,
    `scheme_name`           VARCHAR(255)    NOT NULL,
    `amount_per_candidate`  DECIMAL(10,2)   NOT NULL,
    `status`                TINYINT         NOT NULL DEFAULT 1,
    `created_by`            INT             NOT NULL,
    `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_invoice_master_ssc_scheme` (`ssc_id`, `scheme_id`),
    INDEX `idx_invoice_master_ssc` (`ssc_id`),
    INDEX `idx_invoice_master_scheme` (`scheme_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 2. Assessor Invoice Amounts — per assessor rate config
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assessor_invoice_amounts` (
    `id`                    INT             NOT NULL AUTO_INCREMENT,
    `assessor_id`           INT             NOT NULL,
    `per_candidate_amount`  DECIMAL(10,2)   NOT NULL,
    `effective_from`        DATE            NULL,
    `status`                TINYINT         NOT NULL DEFAULT 1,
    `created_by`            INT             NOT NULL,
    `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_assessor_invoice_amount` (`assessor_id`),
    INDEX `idx_assessor_invoice_assessor` (`assessor_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 3. TP Invoice Amounts — training partner per-candidate rates
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tp_invoice_amounts` (
    `id`                    INT             NOT NULL AUTO_INCREMENT,
    `scheme_id`             INT             NOT NULL,
    `amount_per_candidate`  DECIMAL(10,2)   NOT NULL,
    `status`                TINYINT         NOT NULL DEFAULT 1,
    `created_by`            INT             NOT NULL,
    `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_tp_invoice_amount` (`scheme_id`),
    INDEX `idx_tp_invoice_scheme` (`scheme_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 4. SSC Invoices — assessment invoices for SSC
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ssc_invoices` (
    `id`                    INT                         NOT NULL AUTO_INCREMENT,
    `invoice_number`        VARCHAR(50)                 NULL,
    `batch_id`              INT                         NOT NULL,
    `ssc_id`                INT                         NOT NULL,
    `assessment_date`        DATETIME                    NULL,
    `scheme`                VARCHAR(255)                NULL,
    `total_candidate`       INT                         NOT NULL,
    `present_candidate`     INT                         NOT NULL,
    `amount_per_candidate`  DECIMAL(10,2)               NOT NULL,
    `total_amount`          DECIMAL(10,2)               NOT NULL,
    `group_photo`           VARCHAR(500)                NULL,
    `attendance_sheet`      VARCHAR(500)                NULL,
    `payment_status`        TINYINT                     NOT NULL DEFAULT 0 COMMENT '0=pending, 1=received',
    `received_amount`       DECIMAL(10,2)               NULL,
    `deduction_amount`      DECIMAL(10,2)               NULL DEFAULT 0.00,
    `actual_received_amount` DECIMAL(10,2)              NULL,
    `difference_amount`     DECIMAL(10,2)               NULL,
    `notes`                 TEXT                        NULL,
    `agency_id`             INT                         NOT NULL,
    `created_by`            INT                         NOT NULL,
    `created_at`            DATETIME                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_ssc_invoice_number` (`invoice_number`),
    INDEX `idx_ssc_invoice_batch` (`batch_id`),
    INDEX `idx_ssc_invoice_ssc` (`ssc_id`),
    INDEX `idx_ssc_invoice_agency` (`agency_id`),
    INDEX `idx_ssc_invoice_payment_status` (`payment_status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 5. Assessor Invoices — assessor/proctor invoices with full workflow
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assessor_invoices` (
    `id`                    INT                                 NOT NULL AUTO_INCREMENT,
    `invoice_number`        VARCHAR(50)                         NULL,
    `batch_id`              INT                                 NOT NULL,
    `ssc_id`                INT                                 NOT NULL,
    `assessor_id`           INT                                 NOT NULL,
    `assessment_date`        DATETIME                            NULL,
    `total_candidate`       INT                                 NOT NULL,
    `present_candidate`     INT                                 NOT NULL,
    `amount_per_candidate`  DECIMAL(10,2)                       NOT NULL,
    `total_amount`          DECIMAL(10,2)                       NOT NULL,
    `invoice_pdf`           VARCHAR(500)                        NULL,
    `signed_copy`           VARCHAR(500)                        NULL,
    `invoice_status`        TINYINT                     NOT NULL DEFAULT 0 COMMENT '0=draft, 1=pending_approval, 2=approved, 3=rejected',
    `amount_status`         TINYINT                     NOT NULL DEFAULT 0 COMMENT '0=pending, 1=transferred',
    `advance_amount`        DECIMAL(10,2)                       NULL DEFAULT 0.00,
    `tds_amount`            DECIMAL(10,2)                       NULL DEFAULT 0.00,
    `other_deduction`       DECIMAL(10,2)                       NULL DEFAULT 0.00,
    `net_amount`            DECIMAL(10,2)                       NULL,
    `transaction_no`        VARCHAR(100)                        NULL,
    `transaction_slip`      VARCHAR(500)                        NULL,
    `notes`                 TEXT                                NULL,
    `agency_id`             INT                                 NOT NULL,
    `created_by`            INT                                 NOT NULL,
    `created_at`            DATETIME                            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME                            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_assessor_invoice_number` (`invoice_number`),
    INDEX `idx_assessor_invoice_batch` (`batch_id`),
    INDEX `idx_assessor_invoice_assessor` (`assessor_id`),
    INDEX `idx_assessor_invoice_agency` (`agency_id`),
    INDEX `idx_assessor_invoice_status` (`invoice_status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 6. TP Invoices — training partner invoices
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tp_invoices` (
    `id`                    INT                             NOT NULL AUTO_INCREMENT,
    `invoice_number`        VARCHAR(50)                     NULL,
    `batch_id`              INT                             NOT NULL,
    `scheme_id`             INT                             NOT NULL,
    `tp_id`                 INT                             NOT NULL,
    `total_candidate`       INT                             NOT NULL,
    `amount_per_candidate`  DECIMAL(10,2)                   NOT NULL,
    `total_amount`          DECIMAL(10,2)                   NOT NULL,
    `gst_amount`            DECIMAL(10,2)                   NOT NULL DEFAULT 0.00,
    `invoice_pdf`           VARCHAR(500)                    NULL,
    `invoice_status`        TINYINT                     NOT NULL DEFAULT 0 COMMENT '0=draft, 1=shared',
    `payment_status`        TINYINT                     NOT NULL DEFAULT 0 COMMENT '0=pending, 1=received',
    `payment_receipt`       VARCHAR(500)                    NULL,
    `notes`                 TEXT                            NULL,
    `agency_id`             INT                             NOT NULL,
    `created_by`            INT                             NOT NULL,
    `created_at`            DATETIME                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME                        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_tp_invoice_number` (`invoice_number`),
    INDEX `idx_tp_invoice_batch` (`batch_id`),
    INDEX `idx_tp_invoice_tp` (`tp_id`),
    INDEX `idx_tp_invoice_agency` (`agency_id`),
    INDEX `idx_tp_invoice_status` (`invoice_status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- ALTER existing tables (run if tables already exist without invoice_number)
-- Also converts ENUM to TINYINT for better performance
-- -----------------------------------------------------------
ALTER TABLE `ssc_invoices` ADD COLUMN `invoice_number` VARCHAR(50) NULL AFTER `id`;
ALTER TABLE `ssc_invoices` ADD UNIQUE KEY `uq_ssc_invoice_number` (`invoice_number`);
ALTER TABLE `ssc_invoices` MODIFY `payment_status` TINYINT NOT NULL DEFAULT 0 COMMENT '0=pending, 1=received';

ALTER TABLE `assessor_invoices` ADD COLUMN `invoice_number` VARCHAR(50) NULL AFTER `id`;
ALTER TABLE `assessor_invoices` ADD UNIQUE KEY `uq_assessor_invoice_number` (`invoice_number`);
ALTER TABLE `assessor_invoices` MODIFY `invoice_status` TINYINT NOT NULL DEFAULT 0 COMMENT '0=draft, 1=pending_approval, 2=approved, 3=rejected';
ALTER TABLE `assessor_invoices` MODIFY `amount_status` TINYINT NOT NULL DEFAULT 0 COMMENT '0=pending, 1=transferred';

ALTER TABLE `tp_invoices` ADD COLUMN `invoice_number` VARCHAR(50) NULL AFTER `id`;
ALTER TABLE `tp_invoices` ADD UNIQUE KEY `uq_tp_invoice_number` (`invoice_number`);
ALTER TABLE `tp_invoices` MODIFY `invoice_status` TINYINT NOT NULL DEFAULT 0 COMMENT '0=draft, 1=shared';
ALTER TABLE `tp_invoices` MODIFY `payment_status` TINYINT NOT NULL DEFAULT 0 COMMENT '0=pending, 1=received';
