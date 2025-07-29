-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "collection_uri" TEXT,
ADD COLUMN     "has_blink" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';
