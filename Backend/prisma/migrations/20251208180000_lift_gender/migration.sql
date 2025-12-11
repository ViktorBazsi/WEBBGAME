-- Add gender column to LiftCapacity and adjust unique
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Gender') THEN
    CREATE TYPE "public"."Gender" AS ENUM ('MALE','FEMALE');
  END IF;
END$$;

ALTER TABLE "public"."LiftCapacity"
  ADD COLUMN IF NOT EXISTS "gender" "public"."Gender";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'LiftCapacity_strLevel_key'
  ) THEN
    ALTER TABLE "public"."LiftCapacity" DROP CONSTRAINT "LiftCapacity_strLevel_key";
  END IF;
END$$;

ALTER TABLE "public"."LiftCapacity"
  ADD CONSTRAINT "LiftCapacity_strLevel_gender_key" UNIQUE ("strLevel","gender");
