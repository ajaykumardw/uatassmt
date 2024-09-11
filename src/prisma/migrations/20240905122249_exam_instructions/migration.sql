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
DROP INDEX `users_city_id_fkey` ON `users`;

-- DropIndex
DROP INDEX `users_role_id_fkey` ON `users`;

-- DropIndex
DROP INDEX `users_state_id_fkey` ON `users`;

-- CreateTable
CREATE TABLE `exam_instructions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ssc_id` INTEGER NOT NULL,
    `instruction` TEXT NOT NULL,
    `agency_id` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `students` ADD CONSTRAINT `students_batch_name_fkey` FOREIGN KEY (`batch_name`) REFERENCES `batches`(`batch_name`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_instructions` ADD CONSTRAINT `exam_instructions_ssc_id_fkey` FOREIGN KEY (`ssc_id`) REFERENCES `sector_skill_councils`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_instructions` ADD CONSTRAINT `exam_instructions_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_nosToqualification_packs` ADD CONSTRAINT `_nosToqualification_packs_A_fkey` FOREIGN KEY (`A`) REFERENCES `nos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_nosToqualification_packs` ADD CONSTRAINT `_nosToqualification_packs_B_fkey` FOREIGN KEY (`B`) REFERENCES `qualification_packs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_pcToquestions` ADD CONSTRAINT `_pcToquestions_A_fkey` FOREIGN KEY (`A`) REFERENCES `pc`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_pcToquestions` ADD CONSTRAINT `_pcToquestions_B_fkey` FOREIGN KEY (`B`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
