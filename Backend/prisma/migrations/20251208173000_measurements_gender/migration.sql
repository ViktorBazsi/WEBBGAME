-- Gender enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Gender') THEN
    CREATE TYPE "public"."Gender" AS ENUM ('MALE','FEMALE');
  END IF;
END$$;

-- Measurements gender column + unique constraint
ALTER TABLE "public"."Measurements"
  ADD COLUMN IF NOT EXISTS "gender" "public"."Gender";

-- Drop old unique if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Measurements_strLevel_key'
  ) THEN
    ALTER TABLE "public"."Measurements" DROP CONSTRAINT "Measurements_strLevel_key";
  END IF;
END$$;

ALTER TABLE "public"."Measurements"
  ADD CONSTRAINT "Measurements_strLevel_gender_key" UNIQUE ("strLevel","gender");
