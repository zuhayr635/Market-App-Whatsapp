CREATE TABLE IF NOT EXISTS `product_variation_value_images` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `variationValueId` VARCHAR(191) NOT NULL,
    `imageUrl` TEXT NOT NULL,

    UNIQUE INDEX `product_variation_value_images_productId_variationValueId_key`(`productId`, `variationValueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `product_variation_value_images`
    ADD CONSTRAINT `product_variation_value_images_productId_fkey`
    FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `product_variation_value_images`
    ADD CONSTRAINT `product_variation_value_images_variationValueId_fkey`
    FOREIGN KEY (`variationValueId`) REFERENCES `variation_values`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
