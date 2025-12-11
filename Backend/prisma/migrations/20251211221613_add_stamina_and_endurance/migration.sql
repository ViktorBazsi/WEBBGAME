-- AlterEnum
ALTER TYPE "public"."StatType" ADD VALUE 'STA';

-- AlterTable
ALTER TABLE "public"."Stats" ADD COLUMN     "currStaXp" INTEGER DEFAULT 0,
ADD COLUMN     "currentStamina" INTEGER DEFAULT 1,
ADD COLUMN     "sta" INTEGER;

-- AlterTable
ALTER TABLE "public"."SubActivity" ADD COLUMN     "staminaCost" INTEGER DEFAULT 1;

-- CreateTable
CREATE TABLE "public"."EnduranceCapacity" (
    "id" TEXT NOT NULL,
    "staLevel" INTEGER NOT NULL,
    "gender" "public"."Gender",
    "distanceKm" INTEGER,
    "timeMinutes" INTEGER,

    CONSTRAINT "EnduranceCapacity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnduranceCapacity_staLevel_gender_key" ON "public"."EnduranceCapacity"("staLevel", "gender");
