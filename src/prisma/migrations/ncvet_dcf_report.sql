-- ============================================================
-- NCVET DCF Report - Migration Script
-- Run this AFTER merging the feature/ncvet-dcf-report branch
-- ============================================================

-- 1. Insert report_type (ignore if already exists)
INSERT IGNORE INTO report_types (id, name, code, created_by, created_at, updated_at)
VALUES (5, 'SSC wise Report', 'ncvet_dcf_report', 1, NOW(), NOW());

-- 2. Set the report_type_id
SET @reportTypeId = (SELECT id FROM report_types WHERE code = 'ncvet_dcf_report');

-- 3. Insert report_fields (ignore duplicates on field_code)
INSERT IGNORE INTO report_fields (field_name, field_code, created_by, created_at, updated_at) VALUES
('AB Name', 'dcf_ab_name', 1, NOW(), NOW()),
('Month', 'dcf_month', 1, NOW(), NOW()),
('Year', 'dcf_year', 1, NOW(), NOW()),
('Batch ID', 'dcf_batch_id', 1, NOW(), NOW()),
('SIDH Batch ID', 'dcf_sidh_batch', 1, NOW(), NOW()),
('Training Mode', 'dcf_training_mode', 1, NOW(), NOW()),
('Training Center Name', 'dcf_tc_name', 1, NOW(), NOW()),
('Training Center Address', 'dcf_tc_address', 1, NOW(), NOW()),
('Empanelment Type', 'dcf_empanelment', 1, NOW(), NOW()),
('State', 'dcf_state', 1, NOW(), NOW()),
('District', 'dcf_district', 1, NOW(), NOW()),
('Pincode', 'dcf_pincode', 1, NOW(), NOW()),
('NQR Code', 'dcf_nqr_code', 1, NOW(), NOW()),
('NSQF Level', 'dcf_nsqf_level', 1, NOW(), NOW()),
('Sector', 'dcf_sector', 1, NOW(), NOW()),
('Sub Sector', 'dcf_sub_sector', 1, NOW(), NOW()),
('Category', 'dcf_category', 1, NOW(), NOW()),
('QP Name', 'dcf_qp_name', 1, NOW(), NOW()),
('QP Version', 'dcf_version', 1, NOW(), NOW()),
('Qualification Type', 'dcf_qual_type', 1, NOW(), NOW()),
('Training Type', 'dcf_training_type', 1, NOW(), NOW()),
('Training Segment', 'dcf_training_segment', 1, NOW(), NOW()),
('Funding Source', 'dcf_funding', 1, NOW(), NOW()),
('Scheme Name', 'dcf_scheme_name', 1, NOW(), NOW()),
('Certified Trainer', 'dcf_certified_trainer', 1, NOW(), NOW()),
('Trainer ID', 'dcf_trainer_id', 1, NOW(), NOW()),
('Training Language', 'dcf_language', 1, NOW(), NOW()),
('Training Start Date', 'dcf_training_start_date', 1, NOW(), NOW()),
('Training End Date', 'dcf_training_end_date', 1, NOW(), NOW()),
('Industry Training', 'dcf_industry_training', 1, NOW(), NOW()),
('Feedback Collected', 'dcf_feedback_collected', 1, NOW(), NOW()),
('Total Enrolled', 'dcf_total_enrolled', 1, NOW(), NOW()),
('Women Enrolled', 'dcf_women_enrolled', 1, NOW(), NOW()),
('PwD Enrolled', 'dcf_pwd_enrolled', 1, NOW(), NOW()),
('Completed Training', 'dcf_completed_training', 1, NOW(), NOW()),
('OJT Sent', 'dcf_ojt_sent', 1, NOW(), NOW()),
('APAAR ID Count', 'dcf_apaar_id_count', 1, NOW(), NOW()),
('Assessment Request Date', 'dcf_assessment_request_date', 1, NOW(), NOW()),
('Assessment Proposed Date', 'dcf_assessment_proposed_date', 1, NOW(), NOW()),
('Assessment Conducted', 'dcf_assessment_conducted', 1, NOW(), NOW()),
('Not Conducted Reason', 'dcf_not_conducted_reason', 1, NOW(), NOW()),
('AA Name', 'dcf_aa_name', 1, NOW(), NOW()),
('AA Allotment Date', 'dcf_aa_allotment_date', 1, NOW(), NOW()),
('Assessment Mode', 'dcf_assessment_mode', 1, NOW(), NOW()),
('Preferred Language', 'dcf_preferred_language', 1, NOW(), NOW()),
('Assessment Language', 'dcf_assessment_language', 1, NOW(), NOW()),
('Scheduled Date', 'dcf_scheduled_date', 1, NOW(), NOW()),
('Learners Assessed', 'dcf_learners_assessed', 1, NOW(), NOW()),
('Actual Start Date', 'dcf_actual_start_date', 1, NOW(), NOW()),
('Actual End Date', 'dcf_actual_end_date', 1, NOW(), NOW()),
('Assessors Deployed', 'dcf_assessors_deployed', 1, NOW(), NOW()),
('Assessor ID', 'dcf_assessor_id', 1, NOW(), NOW()),
('Proctoring Mode', 'dcf_proctoring_mode', 1, NOW(), NOW()),
('Learners Passed', 'dcf_learners_passed', 1, NOW(), NOW()),
('Average Marks', 'dcf_avg_marks', 1, NOW(), NOW()),
('Result Received Date', 'dcf_result_received_date', 1, NOW(), NOW()),
('Result Published Date', 'dcf_result_published_date', 1, NOW(), NOW()),
('Certificate Issued Date', 'dcf_certificate_issued_date', 1, NOW(), NOW()),
('DigiLocker Date', 'dcf_digilocker_date', 1, NOW(), NOW()),
('ABC Upload Date', 'dcf_abc_upload_date', 1, NOW(), NOW()),
('Placements Conducted', 'dcf_placements_conducted', 1, NOW(), NOW()),
('Learners Placed', 'dcf_learners_placed', 1, NOW(), NOW()),
('Average Salary', 'dcf_avg_salary', 1, NOW(), NOW()),
('Self Employed', 'dcf_self_employed', 1, NOW(), NOW()),
('Average Income', 'dcf_avg_income', 1, NOW(), NOW()),
('Remarks', 'dcf_remarks', 1, NOW(), NOW());

-- 4. Insert report_type_fields pivot (link all dcf_ fields to the NCVET DCF Report)
--    is_default=1 so all fields are pre-selected when user picks this report type
INSERT IGNORE INTO report_type_fields (report_type_id, report_field_id, sort_order, is_default, created_by, created_at, updated_at)
SELECT @reportTypeId, rf.id, ROW_NUMBER() OVER (ORDER BY rf.id), 1, 1, NOW(), NOW()
FROM report_fields rf
WHERE rf.field_code LIKE 'dcf_%';
