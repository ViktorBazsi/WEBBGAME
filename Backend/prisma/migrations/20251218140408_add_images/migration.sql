-- AlterTable
ALTER TABLE "public"."Character" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."Girlfriend" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."Job" ADD COLUMN     "img" TEXT;

-- AlterTable
ALTER TABLE "public"."SubActivity" ADD COLUMN     "img" TEXT;
