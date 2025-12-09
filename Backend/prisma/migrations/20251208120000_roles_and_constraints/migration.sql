-- Girlfriend character optional, affection default 50 (idempotent)
ALTER TABLE "public"."Girlfriend" ALTER COLUMN "characterId" DROP NOT NULL;
ALTER TABLE "public"."Girlfriend" ALTER COLUMN "affection" SET DEFAULT 50;

-- Stats cascade on delete (idempotent guards)
ALTER TABLE "public"."Stats" DROP CONSTRAINT IF EXISTS "Stats_characterId_fkey";
ALTER TABLE "public"."Stats" DROP CONSTRAINT IF EXISTS "Stats_girlfriendId_fkey";
ALTER TABLE "public"."Stats" ADD CONSTRAINT "Stats_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Stats" ADD CONSTRAINT "Stats_girlfriendId_fkey" FOREIGN KEY ("girlfriendId") REFERENCES "public"."Girlfriend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Activity name unique (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='Activity_name_key') THEN
    CREATE UNIQUE INDEX "Activity_name_key" ON "public"."Activity"("name");
  END IF;
END$$;
