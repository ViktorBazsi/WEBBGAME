-- Add XP tracking fields to Stats
ALTER TABLE "public"."Stats"
  ADD COLUMN IF NOT EXISTS "currStrXp" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currDexXp" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currIntXp" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currCharXp" INTEGER NOT NULL DEFAULT 0;

-- SubActivity type
ALTER TABLE "public"."SubActivity"
  ADD COLUMN IF NOT EXISTS "type" TEXT;

-- StatType enum (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatType') THEN
    CREATE TYPE "public"."StatType" AS ENUM ('STR', 'DEX', 'INT', 'CHAR');
  END IF;
END$$;

-- StatRequirement table
CREATE TABLE IF NOT EXISTS "public"."StatRequirement" (
  "id" TEXT NOT NULL,
  "statType" "public"."StatType" NOT NULL,
  "level" INTEGER NOT NULL,
  "neededXp" INTEGER NOT NULL,
  CONSTRAINT "StatRequirement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StatRequirement_statType_level_key" UNIQUE ("statType","level")
);
