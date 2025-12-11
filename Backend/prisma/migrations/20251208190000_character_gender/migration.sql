-- Ensure Gender enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Gender') THEN
    CREATE TYPE "public"."Gender" AS ENUM ('MALE','FEMALE');
  END IF;
END$$;

-- Add gender columns
ALTER TABLE "public"."Character"
  ADD COLUMN IF NOT EXISTS "gender" "public"."Gender" NOT NULL DEFAULT 'MALE';

ALTER TABLE "public"."Girlfriend"
  ADD COLUMN IF NOT EXISTS "gender" "public"."Gender" NOT NULL DEFAULT 'FEMALE';
