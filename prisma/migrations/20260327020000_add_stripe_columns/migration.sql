-- Add stripeSessionId column to orders (IF NOT EXISTS for idempotency)
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `stripeSessionId` VARCHAR(191) NULL;

-- Add stripePaymentStatus column to orders (IF NOT EXISTS for idempotency)
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `stripePaymentStatus` VARCHAR(191) NULL;
