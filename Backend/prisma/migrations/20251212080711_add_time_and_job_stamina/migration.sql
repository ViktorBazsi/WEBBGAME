-- AlterTable
ALTER TABLE "public"."Character" ALTER COLUMN "time" SET DEFAULT 480;

-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN     "staminaCost" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."SubActivity" ADD COLUMN     "length" INTEGER DEFAULT 30;
