-- Add stripeSessionId column to orders
ALTER TABLE `orders` ADD COLUMN `stripeSessionId` VARCHAR(191) NULL;

-- Add stripePaymentStatus column to orders
ALTER TABLE `orders` ADD COLUMN `stripePaymentStatus` VARCHAR(191) NULL;
