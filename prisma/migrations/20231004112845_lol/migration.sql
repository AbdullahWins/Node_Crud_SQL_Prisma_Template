/*
  Warnings:

  - Made the column `name` on table `girlfriend` required. This step will fail if there are existing NULL values in that column.
  - Made the column `age` on table `girlfriend` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `girlfriend` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pros` on table `girlfriend` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cons` on table `girlfriend` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `girlfriend` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `girlfriend` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `girlfriend` ADD COLUMN `image` VARCHAR(191) NULL,
    MODIFY `name` VARCHAR(191) NOT NULL,
    MODIFY `age` INTEGER NOT NULL,
    MODIFY `location` VARCHAR(191) NOT NULL,
    MODIFY `pros` VARCHAR(191) NOT NULL,
    MODIFY `cons` VARCHAR(191) NOT NULL,
    MODIFY `type` VARCHAR(191) NOT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL;
