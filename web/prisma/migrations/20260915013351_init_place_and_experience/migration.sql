-- CreateTable
CREATE TABLE `place` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(96) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `tagline` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `crest_image` VARCHAR(255) NOT NULL,
    `hero_image` VARCHAR(255) NOT NULL,
    `world_x` DOUBLE NOT NULL,
    `world_y` DOUBLE NOT NULL,
    `world_z` DOUBLE NOT NULL,
    `camera_x` DOUBLE NOT NULL,
    `camera_y` DOUBLE NOT NULL,
    `camera_z` DOUBLE NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `place_slug_key`(`slug`),
    INDEX `place_published_position_idx`(`published`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `experience` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(96) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `description` TEXT NOT NULL,
    `image` VARCHAR(255) NOT NULL,
    `kind` ENUM('FOOD', 'TRAIL', 'TOUR', 'EVENT', 'STAY') NOT NULL,
    `duration_minutes` INTEGER NULL,
    `place_id` INTEGER NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `experience_published_position_idx`(`published`, `position`),
    UNIQUE INDEX `experience_place_id_slug_key`(`place_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `experience` ADD CONSTRAINT `experience_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `place`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
