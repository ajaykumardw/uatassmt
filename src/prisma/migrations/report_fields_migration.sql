-- ============================================================
-- Report Fields Migration
-- Adds new columns for report data across 4 tables
-- NOTE: MySQL 8 does NOT support ADD COLUMN IF NOT EXISTS,
-- so plain ADD COLUMN is used (columns verified absent)
-- ============================================================

-- 1. batches table (9 new columns)
ALTER TABLE batches
  ADD COLUMN batch_allocated_date DateTime NULL,
  ADD COLUMN batch_acceptance VARCHAR(20) NULL,
  ADD COLUMN batch_type VARCHAR(50) NULL,
  ADD COLUMN is_sidh_batch VARCHAR(10) NULL,
  ADD COLUMN is_nsqf_aligned VARCHAR(20) NULL,
  ADD COLUMN funding_type VARCHAR(50) NULL,
  ADD COLUMN training_type VARCHAR(50) NULL,
  ADD COLUMN batch_start_date DateTime NULL,
  ADD COLUMN batch_end_date DateTime NULL;

-- 2. sector_skill_councils table (2 new columns)
ALTER TABLE sector_skill_councils
  ADD COLUMN sector VARCHAR(100) NULL,
  ADD COLUMN sub_sector VARCHAR(100) NULL;

-- 3. qualification_packs table (1 new column)
ALTER TABLE qualification_packs
  ADD COLUMN qualification_type VARCHAR(50) NULL;

-- 4. exam_sets table (1 new column)
ALTER TABLE exam_sets
  ADD COLUMN qb_consultation VARCHAR(50) NULL;
