/*
  Warnings:

  - You are about to drop the column `batch_name` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `enrollment_no` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `trainee_name` on the `students` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[candidate_id]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_name]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `qp_id` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ssc_id` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `batch_id` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `candidate_id` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `candidate_name` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_name` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `batches_qp_id_fkey` ON `batches`;

-- DropIndex
DROP INDEX `batches_scheme_id_fkey` ON `batches`;

-- DropIndex
DROP INDEX `batches_sub_scheme_id_fkey` ON `batches`;

-- DropIndex
DROP INDEX `batches_training_centre_id_fkey` ON `batches`;

-- DropIndex
DROP INDEX `batches_training_partner_id_fkey` ON `batches`;

-- DropIndex
DROP INDEX `exam_instructions_agency_id_fkey` ON `exam_instructions`;

-- DropIndex
DROP INDEX `exam_instructions_ssc_id_fkey` ON `exam_instructions`;

-- DropIndex
DROP INDEX `nos_ssc_id_fkey` ON `nos`;

-- DropIndex
DROP INDEX `pc_nos_id_fkey` ON `pc`;

-- DropIndex
DROP INDEX `qualification_packs_ssc_id_fkey` ON `qualification_packs`;

-- DropIndex
DROP INDEX `qualification_packs_version_id_fkey` ON `qualification_packs`;

-- DropIndex
DROP INDEX `schemes_parent_id_fkey` ON `schemes`;

-- DropIndex
DROP INDEX `sector_skill_councils_agency_id_fkey` ON `sector_skill_councils`;

-- DropIndex
DROP INDEX `students_agency_id_fkey` ON `students`;

-- DropIndex
DROP INDEX `students_batch_name_fkey` ON `students`;

-- DropIndex
DROP INDEX `students_enrollment_no_key` ON `students`;

-- DropIndex
DROP INDEX `users_city_id_fkey` ON `users`;

-- DropIndex
DROP INDEX `users_role_id_fkey` ON `users`;

-- DropIndex
DROP INDEX `users_state_id_fkey` ON `users`;

-- AlterTable
ALTER TABLE `batches` ADD COLUMN `assessor_assign_datetime` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `exam_instructions` ADD COLUMN `status` TINYINT NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `questions` ADD COLUMN `nos_id` INTEGER NULL,
    ADD COLUMN `qp_id` INTEGER NOT NULL,
    ADD COLUMN `ssc_id` INTEGER NOT NULL,
    MODIFY `answer` TINYINT NULL;

-- AlterTable
ALTER TABLE `students` DROP COLUMN `batch_name`,
    DROP COLUMN `enrollment_no`,
    DROP COLUMN `trainee_name`,
    ADD COLUMN `batch_id` INTEGER NOT NULL,
    ADD COLUMN `candidate_id` VARCHAR(60) NOT NULL,
    ADD COLUMN `candidate_name` VARCHAR(50) NOT NULL,
    ADD COLUMN `password` VARCHAR(80) NOT NULL,
    ADD COLUMN `user_name` VARCHAR(60) NOT NULL;

-- CreateTable
CREATE TABLE `log_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `status` ENUM('IN', 'OUT') NOT NULL DEFAULT 'IN',
    `ip_address` VARCHAR(20) NULL,
    `user_agent` VARCHAR(255) NULL,
    `login_at` DATETIME(0) NULL,
    `logout_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_sets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agency_id` INTEGER NOT NULL,
    `ssc_id` INTEGER NOT NULL,
    `qp_id` INTEGER NOT NULL,
    `set_name` VARCHAR(191) NOT NULL,
    `mode` ENUM('Auto', 'Manual') NOT NULL DEFAULT 'Auto',
    `question_random` TINYINT NOT NULL DEFAULT 1,
    `option_random` TINYINT NOT NULL DEFAULT 1,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_sets_questions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agency_id` INTEGER NOT NULL,
    `exam_set_id` INTEGER NOT NULL,
    `question_id` INTEGER NOT NULL,
    `marks` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `students_candidate_id_key` ON `students`(`candidate_id`);

-- CreateIndex
CREATE UNIQUE INDEX `students_user_name_key` ON `students`(`user_name`);

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_qp_id_fkey` FOREIGN KEY (`qp_id`) REFERENCES `qualification_packs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_scheme_id_fkey` FOREIGN KEY (`scheme_id`) REFERENCES `schemes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_sub_scheme_id_fkey` FOREIGN KEY (`sub_scheme_id`) REFERENCES `schemes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_training_partner_id_fkey` FOREIGN KEY (`training_partner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_training_centre_id_fkey` FOREIGN KEY (`training_centre_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_assessor_id_fkey` FOREIGN KEY (`assessor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schemes` ADD CONSTRAINT `schemes_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `schemes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qualification_packs` ADD CONSTRAINT `qualification_packs_ssc_id_fkey` FOREIGN KEY (`ssc_id`) REFERENCES `sector_skill_councils`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qualification_packs` ADD CONSTRAINT `qualification_packs_version_id_fkey` FOREIGN KEY (`version_id`) REFERENCES `version`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nos` ADD CONSTRAINT `nos_ssc_id_fkey` FOREIGN KEY (`ssc_id`) REFERENCES `sector_skill_councils`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pc` ADD CONSTRAINT `pc_nos_id_fkey` FOREIGN KEY (`nos_id`) REFERENCES `nos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sector_skill_councils` ADD CONSTRAINT `sector_skill_councils_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_state_id_fkey` FOREIGN KEY (`state_id`) REFERENCES `state`(`state_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `city`(`city_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users_additional_data` ADD CONSTRAINT `users_additional_data_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_instructions` ADD CONSTRAINT `exam_instructions_ssc_id_fkey` FOREIGN KEY (`ssc_id`) REFERENCES `sector_skill_councils`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_instructions` ADD CONSTRAINT `exam_instructions_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `log_sessions` ADD CONSTRAINT `log_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_sets_questions` ADD CONSTRAINT `exam_sets_questions_exam_set_id_fkey` FOREIGN KEY (`exam_set_id`) REFERENCES `exam_sets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_sets_questions` ADD CONSTRAINT `exam_sets_questions_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_nosToqualification_packs` ADD CONSTRAINT `_nosToqualification_packs_A_fkey` FOREIGN KEY (`A`) REFERENCES `nos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_nosToqualification_packs` ADD CONSTRAINT `_nosToqualification_packs_B_fkey` FOREIGN KEY (`B`) REFERENCES `qualification_packs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_pcToquestions` ADD CONSTRAINT `_pcToquestions_A_fkey` FOREIGN KEY (`A`) REFERENCES `pc`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_pcToquestions` ADD CONSTRAINT `_pcToquestions_B_fkey` FOREIGN KEY (`B`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
