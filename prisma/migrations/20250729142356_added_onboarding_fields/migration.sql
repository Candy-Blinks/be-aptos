-- AlterTable
ALTER TABLE "User" ADD COLUMN     "is_new_user" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false;
