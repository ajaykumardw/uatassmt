-- DropIndex
DROP INDEX `NOS_ssc_id_fkey` ON `nos`;

-- DropIndex
DROP INDEX `PC_nos_id_fkey` ON `pc`;

-- DropIndex
DROP INDEX `PC_Question_pc_id_fkey` ON `pc_question`;

-- DropIndex
DROP INDEX `PC_Question_question_id_fkey` ON `pc_question`;

-- DropIndex
DROP INDEX `qualification_packs_ssc_id_fkey` ON `qualification_packs`;

-- DropIndex
DROP INDEX `qualification_packs_version_id_fkey` ON `qualification_packs`;

-- DropIndex
DROP INDEX `Qualification_packs_NOS_nos_id_fkey` ON `qualification_packs_nos`;

-- DropIndex
DROP INDEX `Qualification_packs_NOS_qualification_pack_id_fkey` ON `qualification_packs_nos`;

-- DropIndex
DROP INDEX `sector_skill_councils_agency_id_fkey` ON `sector_skill_councils`;

-- AddForeignKey
ALTER TABLE `qualification_packs` ADD CONSTRAINT `qualification_packs_ssc_id_fkey` FOREIGN KEY (`ssc_id`) REFERENCES `sector_skill_councils`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qualification_packs` ADD CONSTRAINT `qualification_packs_version_id_fkey` FOREIGN KEY (`version_id`) REFERENCES `Version`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Qualification_packs_NOS` ADD CONSTRAINT `Qualification_packs_NOS_qualification_pack_id_fkey` FOREIGN KEY (`qualification_pack_id`) REFERENCES `qualification_packs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Qualification_packs_NOS` ADD CONSTRAINT `Qualification_packs_NOS_nos_id_fkey` FOREIGN KEY (`nos_id`) REFERENCES `NOS`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NOS` ADD CONSTRAINT `NOS_ssc_id_fkey` FOREIGN KEY (`ssc_id`) REFERENCES `sector_skill_councils`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PC` ADD CONSTRAINT `PC_nos_id_fkey` FOREIGN KEY (`nos_id`) REFERENCES `NOS`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PC_Question` ADD CONSTRAINT `PC_Question_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `Questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PC_Question` ADD CONSTRAINT `PC_Question_pc_id_fkey` FOREIGN KEY (`pc_id`) REFERENCES `PC`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sector_skill_councils` ADD CONSTRAINT `sector_skill_councils_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
