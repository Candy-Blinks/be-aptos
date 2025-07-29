-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "has_shared_post" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shared_post_id" TEXT;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_shared_post_id_fkey" FOREIGN KEY ("shared_post_id") REFERENCES "Post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
