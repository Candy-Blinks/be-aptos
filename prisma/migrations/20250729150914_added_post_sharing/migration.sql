-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_shared_post_id_fkey";

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "content" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_shared_post_id_fkey" FOREIGN KEY ("shared_post_id") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
