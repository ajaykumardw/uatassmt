-- =====================================================================
-- CANDIDATE RESET SCRIPT
-- Candidate ko aisi state me set karta hai jaise usne kabhi login
-- nahi kiya aur kabhi exam nahi diya.
--
-- USAGE:
--   1. Niche @student_id ko apne candidate ka students.id se replace karo
--   2. Is script ko apne MySQL DB (JO NAYA .env ME HAI) pe run karo
--   3. OPTIONAL: agar group/batch result trace bhi hatana hai to line
--      jahan "OPTIONAL SECTION" likha hai usse uncomment karo
--
-- WARNING: Ye script DELETE/UPDATE karta hai. Pehle backup le lo.
-- =====================================================================

SET @student_id = 6874; -- <-- YAHAN STUDENT ID DAALO (students table ka id)

-- ---------------------------------------------------------------------
-- IMPORTANT: Jo @student_id daala hai usko verify karo pehle
-- ---------------------------------------------------------------------
SELECT id, candidate_id, candidate_name, attendance, result
FROM students
WHERE id = @student_id;

-- ---------------------------------------------------------------------
-- 1. feedback_response_answers (child of feedback_responses)
-- ---------------------------------------------------------------------
DELETE fra
FROM feedback_response_answers fra
INNER JOIN feedback_responses fr
  ON fr.id = fra.feedback_response_id
WHERE fr.user_id = @student_id
  AND fr.user_type = 1;

-- ---------------------------------------------------------------------
-- 2. feedback_responses (blocks exam re-attempt after feedback)
-- ---------------------------------------------------------------------
DELETE FROM feedback_responses
WHERE user_id = @student_id
  AND user_type = 1;

-- ---------------------------------------------------------------------
-- 3. student_captured_images (webcam evidence, FK to exam result)
-- ---------------------------------------------------------------------
DELETE FROM student_captured_images
WHERE student_id = @student_id;

-- ---------------------------------------------------------------------
-- 4. exam_set_results (per-question theory answers)
-- ---------------------------------------------------------------------
DELETE FROM exam_set_results
WHERE student_id = @student_id;

-- ---------------------------------------------------------------------
-- 5. student_exam_set_results ("candidate attempted exam" marker)
--    This resets remaining_attempts back to batches.login_restrict
-- ---------------------------------------------------------------------
DELETE FROM student_exam_set_results
WHERE student_id = @student_id;

-- ---------------------------------------------------------------------
-- 6. student_question_attempts (practical/viva marks)
-- ---------------------------------------------------------------------
DELETE FROM student_question_attempts
WHERE student_id = @student_id;

-- ---------------------------------------------------------------------
-- 7. offline_candidate_papers (offline OMR theory papers)
-- ---------------------------------------------------------------------
DELETE FROM offline_candidate_papers
WHERE student_id = @student_id;

-- ---------------------------------------------------------------------
-- 8. media_files (individual attendance/evidence media)
--    NOTE: sirf candidate_id wale delete honge, group media (NULL) safe
-- ---------------------------------------------------------------------
DELETE FROM media_files
WHERE candidate_id = @student_id;

-- ---------------------------------------------------------------------
-- 9. log_sessions (ALL login history + facial auth images)
--    user_type = 'S' means student (use discordinator to avoid collision)
-- ---------------------------------------------------------------------
DELETE FROM log_sessions
WHERE user_id = @student_id
  AND user_type = 'S';

-- ---------------------------------------------------------------------
-- 10. students row reset (row retained, only status fields reset)
-- ---------------------------------------------------------------------
UPDATE students
SET attendance = 0,
    result = 0,
    certificate_no = NULL,
    is_auto = 0,
    image = NULL,
    id_front_image = NULL,
    id_back_image = NULL
WHERE id = @student_id;

-- =====================================================================
-- OPTIONAL SECTION: Batch-level result/certificate job trace hatana
-- Agar sirf ek candidate reset kar rahe ho to ISSE SKIP KARO.
-- Agar poore batch ka result/certificate re-compute karna hai to
-- uncomment karo aur @batch_id set karo.
-- =====================================================================
-- SET @batch_id = 0;
-- DELETE FROM jobs
-- WHERE reference_type = 'batch'
--   AND reference_id = @batch_id;

-- ---------------------------------------------------------------------
-- VERIFY: Reset ke baad ye sab empty/zero aana chahiye
-- ---------------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM feedback_response_answers fra
    INNER JOIN feedback_responses fr ON fr.id = fra.feedback_response_id
    WHERE fr.user_id = @student_id AND fr.user_type = 1) AS feedback_answers_remaining,
  (SELECT COUNT(*) FROM feedback_responses
    WHERE user_id = @student_id AND user_type = 1) AS feedback_remaining,
  (SELECT COUNT(*) FROM student_captured_images
    WHERE student_id = @student_id) AS captured_images_remaining,
  (SELECT COUNT(*) FROM exam_set_results
    WHERE student_id = @student_id) AS exam_answers_remaining,
  (SELECT COUNT(*) FROM student_exam_set_results
    WHERE student_id = @student_id) AS exam_attempts_remaining,
  (SELECT COUNT(*) FROM student_question_attempts
    WHERE student_id = @student_id) AS question_attempts_remaining,
  (SELECT COUNT(*) FROM offline_candidate_papers
    WHERE student_id = @student_id) AS offline_papers_remaining,
  (SELECT COUNT(*) FROM media_files
    WHERE candidate_id = @student_id) AS media_remaining,
  (SELECT COUNT(*) FROM log_sessions
    WHERE user_id = @student_id AND user_type = 'S') AS login_sessions_remaining,
  (SELECT attendance FROM students WHERE id = @student_id) AS students_attendance,
  (SELECT result FROM students WHERE id = @student_id) AS students_result;
