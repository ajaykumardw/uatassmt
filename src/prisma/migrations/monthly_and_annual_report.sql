-- ============================================================
-- Monthly Report + Annual Report - Migration Script
-- Monthly  = batch-wise (AA Monitoring sheet)
-- Annual   = QP-wise (Assessment Strategy sheet)
-- ============================================================

-- 1. Insert report_types
INSERT IGNORE INTO report_types (id, name, code, created_by, created_at, updated_at) VALUES
(6, 'Monthly Report', 'monthly_report', 1, NOW(), NOW()),
(7, 'Annual Report', 'annual_report', 1, NOW(), NOW());

-- 2. Insert report_fields (monthly)
INSERT IGNORE INTO report_fields (field_name, field_code, created_by, created_at, updated_at) VALUES
('Assessment Agency Name', 'mon_ab_name', 1, NOW(), NOW()),
('Batch ID', 'mon_batch_id', 1, NOW(), NOW()),
('Is it a SIDH batch?', 'mon_sidh_batch', 1, NOW(), NOW()),
('Is it a NSQF Aligned Batch?', 'mon_nsqf_aligned', 1, NOW(), NOW()),
('Month of Batch Assessment', 'mon_month', 1, NOW(), NOW()),
('Year of Batch Assessment', 'mon_year', 1, NOW(), NOW()),
('Date on which Batch allocated by Awarding Body (DD-MM-YYYY)', 'mon_allocation_date', 1, NOW(), NOW()),
('Batch Accepted/Rejected', 'mon_batch_status', 1, NOW(), NOW()),
('State/ UT', 'mon_state', 1, NOW(), NOW()),
('District', 'mon_district', 1, NOW(), NOW()),
('Assessment centre address', 'mon_center_address', 1, NOW(), NOW()),
('Funding Type', 'mon_funding_type', 1, NOW(), NOW()),
('Scheme Name', 'mon_scheme_name', 1, NOW(), NOW()),
('Training Type', 'mon_training_type', 1, NOW(), NOW()),
('Type of qualification', 'mon_qual_type', 1, NOW(), NOW()),
('Sector', 'mon_sector', 1, NOW(), NOW()),
('Level', 'mon_level', 1, NOW(), NOW()),
('NQR code', 'mon_nqr_code', 1, NOW(), NOW()),
('Qualification name', 'mon_qp_name', 1, NOW(), NOW()),
('Mode of assessment', 'mon_assessment_mode', 1, NOW(), NOW()),
('Primary Language of assessment', 'mon_assessment_language', 1, NOW(), NOW()),
('Name of Awarding Entity', 'mon_awarding_entity', 1, NOW(), NOW()),
('Type of Awarding Entity', 'mon_awarding_entity_type', 1, NOW(), NOW()),
('Start Date of Scheduled Assessment (DD-MM-YYYY)', 'mon_scheduled_start_date', 1, NOW(), NOW()),
('Start Date of Actual Assessment (DD-MM-YYYY)', 'mon_actual_start_date', 1, NOW(), NOW()),
('End Date of Actual Assessment (DD-MM-YYYY)', 'mon_actual_end_date', 1, NOW(), NOW()),
('Assessed by valid ToA Certified Assessor', 'mon_toa_certified_assessor', 1, NOW(), NOW()),
('No. of Assessors Deployed for Assessment', 'mon_assessors_deployed', 1, NOW(), NOW()),
('Primary Assessor ID', 'mon_assessor_id', 1, NOW(), NOW()),
('Primary Assessor efficiency in language of assessment', 'mon_assessor_language_efficiency', 1, NOW(), NOW()),
('Mode of Proctoring', 'mon_proctoring_mode', 1, NOW(), NOW()),
('No. of candidates scheduled', 'mon_candidates_scheduled', 1, NOW(), NOW()),
('No. of Candidates assessed', 'mon_candidates_assessed', 1, NOW(), NOW()),
('No. of Candidates passed', 'mon_candidates_passed', 1, NOW(), NOW()),
('Average % Marks obtained', 'mon_avg_marks', 1, NOW(), NOW()),
('Has the result been analysed by Quality/Audit Team?', 'mon_result_analysed', 1, NOW(), NOW()),
('Date of result submission (DD-MM-YYYY)', 'mon_result_submission_date', 1, NOW(), NOW()),
('Whether result is sent back by AB for correction', 'mon_result_correction', 1, NOW(), NOW()),
('Assessment link', 'mon_assessment_link', 1, NOW(), NOW()),
('Has the videos been reviewed by Quality/Audit Team?', 'mon_videos_reviewed', 1, NOW(), NOW()),
('Remarks', 'mon_remarks', 1, NOW(), NOW());

-- 3. Insert report_fields (annual)
INSERT IGNORE INTO report_fields (field_name, field_code, created_by, created_at, updated_at) VALUES
('Assessment Agency Name', 'ann_ab_name', 1, NOW(), NOW()),
('Sector', 'ann_sector', 1, NOW(), NOW()),
('NQR code (If Applicable)', 'ann_nqr_code', 1, NOW(), NOW()),
('Qualification name', 'ann_qp_name', 1, NOW(), NOW()),
('Awarding Entity Name', 'ann_awarding_entity', 1, NOW(), NOW()),
('Type of Awarding Entity', 'ann_awarding_entity_type', 1, NOW(), NOW()),
('Level', 'ann_level', 1, NOW(), NOW()),
('No. of PCs in the Qualification', 'ann_pc_count', 1, NOW(), NOW()),
('No. of questions available in the question bank (QB)', 'ann_qb_questions', 1, NOW(), NOW()),
('QB has been developed in consultation with AB/Industry', 'ann_qb_consultation', 1, NOW(), NOW()),
('Are Question banks available in official languages of Indian', 'ann_qb_languages', 1, NOW(), NOW()),
('Sample Question paper uploaded on the website', 'ann_sample_paper', 1, NOW(), NOW()),
('No. of TOA certified assessors available', 'ann_toa_assessors', 1, NOW(), NOW()),
('Total No. of batches assessed FY25-26', 'ann_batches_assessed', 1, NOW(), NOW()),
('Do you have the mechanism of collecting feedback from students', 'ann_feedback_mechanism', 1, NOW(), NOW()),
('Total no.of batches in which feedback has been collected', 'ann_feedback_batches', 1, NOW(), NOW());

-- 4. Insert report_type_fields pivot (is_default=1 so all pre-selected)
INSERT IGNORE INTO report_type_fields (report_type_id, report_field_id, sort_order, is_default, created_by, created_at, updated_at)
SELECT 6, rf.id, ROW_NUMBER() OVER (ORDER BY rf.id), 1, 1, NOW(), NOW()
FROM report_fields rf
WHERE rf.field_code LIKE 'mon_%';

INSERT IGNORE INTO report_type_fields (report_type_id, report_field_id, sort_order, is_default, created_by, created_at, updated_at)
SELECT 7, rf.id, ROW_NUMBER() OVER (ORDER BY rf.id), 1, 1, NOW(), NOW()
FROM report_fields rf
WHERE rf.field_code LIKE 'ann_%';
