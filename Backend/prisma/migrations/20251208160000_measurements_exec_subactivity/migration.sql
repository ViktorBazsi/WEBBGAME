-- Measurements table
CREATE TABLE IF NOT EXISTS "public"."Measurements" (
  "id" TEXT NOT NULL,
  "strLevel" INTEGER NOT NULL,
  "weight" INTEGER,
  "height" INTEGER,
  "biceps" INTEGER,
  "quads" INTEGER,
  "back" INTEGER,
  "chest" INTEGER,
  "calves" INTEGER,
  CONSTRAINT "Measurements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Measurements_strLevel_key" UNIQUE ("strLevel")
);

-- Stats: drop weight/height if exists, add measurementId
ALTER TABLE "public"."Stats"
  DROP COLUMN IF EXISTS "weight",
  DROP COLUMN IF EXISTS "height";

ALTER TABLE "public"."Stats"
  ADD COLUMN IF NOT EXISTS "measurementId" TEXT;

ALTER TABLE "public"."Stats"
  ADD CONSTRAINT "Stats_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "public"."Measurements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
