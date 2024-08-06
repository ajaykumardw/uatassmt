-- CreateTable
CREATE TABLE `batches` (
    `batch_id` INTEGER NOT NULL AUTO_INCREMENT,
    `batch_name` VARCHAR(191) NULL,
    `project_id` INTEGER NULL,
    `batch_size` VARCHAR(191) NULL,
    `training_centre_id` INTEGER NULL,
    `assessment_start_datetime` DATETIME(0) NULL,
    `assessment_end_datetime` DATETIME(0) NULL,
    `login_restrict` INTEGER NULL DEFAULT 0,
    `assessment_mode` INTEGER NULL,
    `capture_image_in_seconds` INTEGER NULL,
    `is_active` INTEGER NOT NULL DEFAULT 1,
    `created_by` INTEGER NULL,
    `deleted_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL,

    PRIMARY KEY (`batch_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL DEFAULT '',
    `active` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `city` (
    `city_id` INTEGER NOT NULL AUTO_INCREMENT,
    `city_name` VARCHAR(80) NOT NULL,
    `state_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`city_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `country` (
    `country_id` INTEGER NOT NULL AUTO_INCREMENT,
    `sortname` VARCHAR(3) NOT NULL,
    `country_name` VARCHAR(150) NOT NULL,
    `country_code` VARCHAR(4) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`country_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `languages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `alias` VARCHAR(191) NOT NULL DEFAULT '',
    `full_name` VARCHAR(191) NOT NULL DEFAULT '',
    `short_name` VARCHAR(191) NOT NULL DEFAULT '',
    `deleted_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `migrations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `migration` VARCHAR(191) NOT NULL,
    `batch` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `project_id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_name` VARCHAR(191) NULL,
    `project_code` VARCHAR(40) NOT NULL,
    `is_active` INTEGER NOT NULL DEFAULT 1,
    `updated_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL,

    UNIQUE INDEX `project_name`(`project_name`),
    PRIMARY KEY (`project_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qualification_pack_nos_pcs` (
    `nos_pc_id` INTEGER NOT NULL AUTO_INCREMENT,
    `ssc_id` INTEGER NOT NULL,
    `qualification_pack_id` INTEGER NOT NULL,
    `nos_id` INTEGER NOT NULL,
    `pc_name` VARCHAR(100) NULL,
    `is_active` INTEGER NULL DEFAULT 1,
    `created_by` INTEGER NULL,
    `deleted_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL,

    UNIQUE INDEX `qualification_pack_id`(`ssc_id`, `qualification_pack_id`, `nos_id`),
    PRIMARY KEY (`nos_pc_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qualification_pack_pc` (
    `pc_id` INTEGER NOT NULL AUTO_INCREMENT,
    `pc_label_id` VARCHAR(50) NOT NULL,
    `pc_name` VARCHAR(150) NOT NULL,
    `qual_pack_id` INTEGER NOT NULL,
    `nos_id` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `postdate` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`pc_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qualification_packs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ssc_id` INTEGER NOT NULL,
    `qualification_pack_id` VARCHAR(100) NOT NULL,
    `qualification_pack_name` VARCHAR(100) NOT NULL,
    `qualification_pack_level` ENUM('E', 'M', 'H') NOT NULL DEFAULT 'E',
    `version_id` INTEGER NOT NULL,
    `total_marks` DECIMAL(10, 2) NOT NULL,
    `total_theory_marks` DECIMAL(10, 2) NOT NULL,
    `total_practical_marks` DECIMAL(10, 2) NOT NULL,
    `total_viva_marks` DECIMAL(10, 2) NOT NULL,
    `theory_cutoff_marks` DECIMAL(10, 2) NULL,
    `viva_cutoff_marks` DECIMAL(10, 2) NULL,
    `practical_cutoff_marks` DECIMAL(10, 2) NULL,
    `overall_cutoff_marks` DECIMAL(10, 2) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `qualification_packs_qualification_pack_id_key`(`qualification_pack_id`),
    INDEX `qualification_packs_ssc_id_fkey`(`ssc_id`),
    INDEX `qualification_packs_version_id_fkey`(`version_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `version` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `version_number` VARCHAR(20) NOT NULL,
    `version_name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qualification_packs_nos` (
    `nos_id` INTEGER NOT NULL AUTO_INCREMENT,
    `nos_label_id` VARCHAR(20) NOT NULL,
    `nos_name` VARCHAR(191) NOT NULL,
    `q_pack_id` INTEGER NULL,
    `theory_cutoff` DECIMAL(10, 2) NULL,
    `viva_cutoff` DECIMAL(10, 2) NULL,
    `practical_cutoff` DECIMAL(10, 2) NULL,
    `overall_cutoff` DECIMAL(10, 2) NULL,
    `weighted_available` DECIMAL(10, 2) NULL,
    `is_active` INTEGER NOT NULL DEFAULT 1,
    `created_by` INTEGER NOT NULL,
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`nos_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questionpapers` (
    `ques_id` INTEGER NOT NULL AUTO_INCREMENT,
    `question` TEXT NOT NULL,
    `option_a` TEXT NOT NULL,
    `option_b` TEXT NOT NULL,
    `option_c` TEXT NOT NULL,
    `option_d` TEXT NOT NULL,
    `question_level` ENUM('E', 'H', 'M') NOT NULL,
    `correct_answer` ENUM('a', 'b', 'c', 'd') NOT NULL,
    `pcid` INTEGER NOT NULL,
    `postdate` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`ques_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sector_skill_councils` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agency_id` INTEGER NOT NULL,
    `ssc_name` VARCHAR(100) NOT NULL,
    `ssc_code` VARCHAR(60) NULL,
    `ssc_username` VARCHAR(100) NULL,
    `ssc_pwd` VARCHAR(100) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `created_by` INTEGER NULL,
    `deleted_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `sector_skill_councils_agency_id_fkey`(`agency_id`),
    UNIQUE INDEX `sector_skill_council_name`(`ssc_name`, `agency_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `state` (
    `state_id` INTEGER NOT NULL AUTO_INCREMENT,
    `state_name` VARCHAR(80) NOT NULL,
    `country_id` INTEGER NOT NULL DEFAULT 1,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`state_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(100) NOT NULL,
    `user_name` VARCHAR(60) NULL,
    `password` VARCHAR(80) NULL,
    `salt` VARCHAR(80) NULL,
    `company_name` VARCHAR(100) NOT NULL,
    `user_type` VARCHAR(2) NOT NULL DEFAULT 'U',
    `first_name` VARCHAR(100) NULL,
    `last_name` VARCHAR(100) NULL,
    `mobile_no` VARCHAR(15) NOT NULL,
    `landline_no` VARCHAR(15) NULL,
    `gender` ENUM('m', 'f') NOT NULL DEFAULT 'm',
    `date_of_birth` DATE NULL,
    `country_id` INTEGER NULL,
    `state_id` INTEGER NULL,
    `city_id` INTEGER NULL,
    `district_id` INTEGER NULL,
    `address` VARCHAR(191) NULL,
    `pin_code` VARCHAR(6) NULL,
    `time_zone` VARCHAR(100) NULL,
    `avatar` VARCHAR(191) NULL,
    `expiry_date` DATE NULL,
    `is_master` BOOLEAN NOT NULL DEFAULT true,
    `master_id` INTEGER NOT NULL,
    `created_by` INTEGER NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `is_deleted` TINYINT NOT NULL DEFAULT 0,
    `device_id` TEXT NULL,
    `deactive_date` DATETIME(0) NULL,
    `modified_on` DATETIME(0) NULL,
    `created_on` DATETIME(0) NOT NULL,

    UNIQUE INDEX `email`(`email`),
    UNIQUE INDEX `user_name`(`user_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
