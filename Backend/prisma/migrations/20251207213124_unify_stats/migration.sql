/*
  Warnings:

  - You are about to drop the `GfStats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."GfStats" DROP CONSTRAINT "GfStats_gfId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Stats" DROP CONSTRAINT "Stats_characterId_fkey";

-- AlterTable
ALTER TABLE "public"."Stats" ADD COLUMN     "girlfriendId" TEXT,
ALTER COLUMN "characterId" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."GfStats";

-- AddForeignKey
ALTER TABLE "public"."Stats" ADD CONSTRAINT "Stats_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Stats" ADD CONSTRAINT "Stats_girlfriendId_fkey" FOREIGN KEY ("girlfriendId") REFERENCES "public"."Girlfriend"("id") ON DELETE SET NULL ON UPDATE CASCADE;
