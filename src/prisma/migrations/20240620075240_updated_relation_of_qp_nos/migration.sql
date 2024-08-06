/*
  Warnings:

  - You are about to drop the `qualification_packs_nos` table. If the table is not empty, all the data it contains will be lost.

*/
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
DROP INDEX `sector_skill_councils_agency_id_fkey` ON `sector_skill_councils`;

-- DropTable
DROP TABLE `qualification_packs_nos`;

-- CreateTable
CREATE TABLE `_NOSToqualification_packs` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_NOSToqualification_packs_AB_unique`(`A`, `B`),
    INDEX `_NOSToqualification_packs_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `qualification_packs` ADD CONSTRAINT `qualification_packs_ssc_id_fkey` FOREIGN KEY (`ssc_id`) REFERENCES `sector_skill_councils`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qualification_packs` ADD CONSTRAINT `qualification_packs_version_id_fkey` FOREIGN KEY (`version_id`) REFERENCES `Version`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE `_NOSToqualification_packs` ADD CONSTRAINT `_NOSToqualification_packs_A_fkey` FOREIGN KEY (`A`) REFERENCES `NOS`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_NOSToqualification_packs` ADD CONSTRAINT `_NOSToqualification_packs_B_fkey` FOREIGN KEY (`B`) REFERENCES `qualification_packs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
