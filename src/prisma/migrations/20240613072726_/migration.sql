/*
  Warnings:

  - The primary key for the `qualification_packs_nos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `qualification_packs_nos` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `qualification_packs_nos` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `qualification_packs_nos` table. All the data in the column will be lost.
  - You are about to drop the column `nos_label_id` on the `qualification_packs_nos` table. All the data in the column will be lost.
  - You are about to drop the column `nos_name` on the `qualification_packs_nos` table. All the data in the column will be lost.
  - You are about to drop the column `overall_cutoff` on the `qualification_packs_nos` table. All the data in the column will be lost.
  - You are about to drop the column `practical_cutoff` on the `qualification_packs_nos` table. All the data in the column will be lost.
  - You are about to drop the column `q_pack_id` on the `qualification_packs_nos` table. All the data in the column will be lost.
  - You are about to drop the column `theory_cutoff` on the `qualification_packs_nos` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `qualification_packs_nos` table. All the data in the column will be lost.
  - You are about to drop the column `viva_cutoff` on the `qualification_packs_nos` table. All the data in the column will be lost.
  - You are about to drop the column `weighted_available` on the `qualification_packs_nos` table. All the data in the column will be lost.
  - Added the required column `id` to the `Qualification_packs_NOS` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qualification_pack_id` to the `Qualification_packs_NOS` table without a default value. This is not possible if the table is not empty.

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
ALTER TABLE `qualification_packs_nos` DROP PRIMARY KEY,
    DROP COLUMN `created_at`,
    DROP COLUMN `created_by`,
    DROP COLUMN `is_active`,
    DROP COLUMN `nos_label_id`,
    DROP COLUMN `nos_name`,
    DROP COLUMN `overall_cutoff`,
    DROP COLUMN `practical_cutoff`,
    DROP COLUMN `q_pack_id`,
    DROP COLUMN `theory_cutoff`,
    DROP COLUMN `updated_at`,
    DROP COLUMN `viva_cutoff`,
    DROP COLUMN `weighted_available`,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `qualification_pack_id` INTEGER NOT NULL,
    MODIFY `nos_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

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
ALTER TABLE `sector_skill_councils` ADD CONSTRAINT `sector_skill_councils_agency_id_fkey` FOREIGN KEY (`agency_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
