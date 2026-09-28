-- AlterTable
ALTER TABLE `place` ADD COLUMN `menu_lede` VARCHAR(240) NULL,
    ADD COLUMN `menu_title` VARCHAR(80) NULL;

-- CreateTable
CREATE TABLE `menu_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(96) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(240) NOT NULL,
    `tag` VARCHAR(32) NULL,
    `image` VARCHAR(255) NOT NULL,
    `place_id` INTEGER NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `menu_item_published_position_idx`(`published`, `position`),
    UNIQUE INDEX `menu_item_place_id_slug_key`(`place_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `menu_item` ADD CONSTRAINT `menu_item_place_id_fkey` FOREIGN KEY (`place_id`) REFERENCES `place`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
