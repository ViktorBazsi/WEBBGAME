-- AlterTable
ALTER TABLE "public"."Girlfriend" ADD COLUMN     "currentTime" TEXT NOT NULL DEFAULT '08:00',
ADD COLUMN     "time" INTEGER NOT NULL DEFAULT 480;
