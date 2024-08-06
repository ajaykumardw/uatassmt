/*
  Warnings:

  - You are about to drop the column `overall_cutoff_marks` on the `nos` table. All the data in the column will be lost.
  - You are about to drop the column `practical_cutoff_marks` on the `nos` table. All the data in the column will be lost.
  - You are about to drop the column `theory_cutoff_marks` on the `nos` table. All the data in the column will be lost.
  - You are about to drop the column `viva_cutoff_marks` on the `nos` table. All the data in the column will be lost.
  - You are about to drop the column `weighted_available` on the `nos` table. All the data in the column will be lost.

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
ALTER TABLE `nos` DROP COLUMN `overall_cutoff_marks`,
    DROP COLUMN `practical_cutoff_marks`,
    DROP COLUMN `theory_cutoff_marks`,
    DROP COLUMN `viva_cutoff_marks`,
    DROP COLUMN `weighted_available`;

-- AlterTable
ALTER TABLE `qualification_packs` ADD COLUMN `nos_cutoff_marks` DECIMAL(10, 2) NULL,
    ADD COLUMN `weighted_available` DECIMAL(10, 2) NULL;

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
