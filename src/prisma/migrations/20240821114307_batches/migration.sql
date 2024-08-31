/*
  Warnings:

  - The primary key for the `batches` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `batch_id` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `project_id` on the `batches` table. All the data in the column will be lost.
  - Added the required column `id` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qp_id` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheme_id` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sub_scheme_id` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `training_partner_id` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Made the column `batch_size` on table `batches` required. This step will fail if there are existing NULL values in that column.
  - Made the column `training_centre_id` on table `batches` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by` on table `batches` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `batches` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `batches` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `nos_ssc_id_fkey` ON `nos`;

-- DropIndex
DROP INDEX `pc_nos_id_fkey` ON `pc`;

-- DropIndex
DROP INDEX `qualification_packs_ssc_id_fkey` ON `qualification_packs`;

-- DropIndex
DROP INDEX `qualification_packs_version_id_fkey` ON `qualification_packs`;

-- DropIndex
DROP INDEX `sector_skill_councils_agency_id_fkey` ON `sector_skill_councils`;

-- DropIndex
DROP INDEX `users_city_id_fkey` ON `users`;

-- DropIndex
DROP INDEX `users_role_id_fkey` ON `users`;

-- DropIndex
DROP INDEX `users_state_id_fkey` ON `users`;

-- AlterTable
ALTER TABLE `batches` DROP PRIMARY KEY,
    DROP COLUMN `batch_id`,
    DROP COLUMN `is_active`,
    DROP COLUMN `project_id`,
    ADD COLUMN `assessor_id` INTEGER NULL,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `qp_id` INTEGER NOT NULL,
    ADD COLUMN `scheme_id` INTEGER NOT NULL,
    ADD COLUMN `status` TINYINT NOT NULL DEFAULT 1,
    ADD COLUMN `sub_scheme_id` INTEGER NOT NULL,
    ADD COLUMN `training_partner_id` INTEGER NOT NULL,
    MODIFY `batch_size` VARCHAR(191) NOT NULL,
    MODIFY `training_centre_id` INTEGER NOT NULL,
    MODIFY `created_by` INTEGER NOT NULL,
    MODIFY `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `nos` MODIFY `nos_name` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `pc` MODIFY `pc_name` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `users_additional_data` ADD COLUMN `gst_no` VARCHAR(191) NULL,
    MODIFY `employee_id` INTEGER NULL,
    MODIFY `aadhaar_no` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `schemes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scheme_name` VARCHAR(191) NOT NULL,
    `scheme_code` VARCHAR(40) NOT NULL,
    `parent_id` INTEGER NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `scheme_code`(`scheme_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `_nosToqualification_packs` ADD CONSTRAINT `_nosToqualification_packs_A_fkey` FOREIGN KEY (`A`) REFERENCES `nos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_nosToqualification_packs` ADD CONSTRAINT `_nosToqualification_packs_B_fkey` FOREIGN KEY (`B`) REFERENCES `qualification_packs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_pcToquestions` ADD CONSTRAINT `_pcToquestions_A_fkey` FOREIGN KEY (`A`) REFERENCES `pc`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_pcToquestions` ADD CONSTRAINT `_pcToquestions_B_fkey` FOREIGN KEY (`B`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
