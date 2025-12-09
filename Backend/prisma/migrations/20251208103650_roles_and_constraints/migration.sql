-- CreateEnum (idempotent guard)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');
  END IF;
END$$;

-- AlterTable: add role if missing
ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "role" "public"."Role" NOT NULL DEFAULT 'USER';

-- Drop & recreate FK to allow characterId nullable
ALTER TABLE "public"."Girlfriend" DROP CONSTRAINT IF EXISTS "Girlfriend_characterId_fkey";
ALTER TABLE "public"."Girlfriend"
  ALTER COLUMN "characterId" DROP NOT NULL;
ALTER TABLE "public"."Girlfriend"
  ADD CONSTRAINT "Girlfriend_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
