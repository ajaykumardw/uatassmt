/*
  Warnings:

  - You are about to drop the column `qualification_pack_level` on the `qualification_packs` table. All the data in the column will be lost.
  - Added the required column `nqr_code` to the `qualification_packs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `NOS_ssc_id_fkey` ON `nos`;

-- DropIndex
DROP INDEX `PC_nos_id_fkey` ON `pc`;

-- DropIndex
DROP INDEX `qualification_packs_ssc_id_fkey` ON `qualification_packs`;

-- DropIndex
DROP INDEX `qualification_packs_version_id_fkey` ON `qualification_packs`;

-- DropIndex
DROP INDEX `sector_skill_councils_agency_id_fkey` ON `sector_skill_councils`;

-- AlterTable
ALTER TABLE `qualification_packs` DROP COLUMN `qualification_pack_level`,
    ADD COLUMN `nqr_code` VARCHAR(100) NOT NULL,
    ADD COLUMN `nsqf_level` TINYINT NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE `qualification_packs` ADD CONSTRAINT `qualification_packs_ssc_id_fkey` FOREIGN KEY (`ssc_id`) REFERENCES `sector_skill_councils`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qualification_packs` ADD CONSTRAINT `qualification_packs_version_id_fkey` FOREIGN KEY (`version_id`) REFERENCES `Version`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NOS` ADD CONSTRAINT `NOS_ssc_id_fkey` FOREIGN KEY (`ssc_id`) REFERENCES `sector_skill_councils`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PC` ADD CONSTRAINT `PC_nos_id_fkey` FOREIGN KEY (`nos_id`) REFERENCES `NOS`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sector_skill_councils` ADD CONSTRAINT `sector_skill_councils_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_NOSToqualification_packs` ADD CONSTRAINT `_NOSToqualification_packs_A_fkey` FOREIGN KEY (`A`) REFERENCES `NOS`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_NOSToqualification_packs` ADD CONSTRAINT `_NOSToqualification_packs_B_fkey` FOREIGN KEY (`B`) REFERENCES `qualification_packs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PCToQuestions` ADD CONSTRAINT `_PCToQuestions_A_fkey` FOREIGN KEY (`A`) REFERENCES `PC`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_PCToQuestions` ADD CONSTRAINT `_PCToQuestions_B_fkey` FOREIGN KEY (`B`) REFERENCES `Questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
