/*
  Warnings:

  - A unique constraint covering the columns `[referral_code]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - The required column `referral_code` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referral_code" TEXT NOT NULL,
ADD COLUMN     "referral_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referred_by" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_referral_code_key" ON "User"("referral_code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "User"("referral_code") ON DELETE SET NULL ON UPDATE CASCADE;
