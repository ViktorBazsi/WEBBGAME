-- Drop columns from Activity
ALTER TABLE "public"."Activity"
  DROP COLUMN IF EXISTS "requirement",
  DROP COLUMN IF EXISTS "description",
  DROP COLUMN IF EXISTS "level",
  DROP COLUMN IF EXISTS "xpNeeded",
  DROP COLUMN IF EXISTS "xpGained",
  DROP COLUMN IF EXISTS "reward";

-- Create SubActivity table
CREATE TABLE "public"."SubActivity" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "activityId" TEXT NOT NULL,
  "requirement" TEXT,
  "description" TEXT,
  "level" INTEGER DEFAULT 1,
  "xpNeeded" INTEGER DEFAULT 50,
  "xpGained" INTEGER DEFAULT 10,
  "reward" INTEGER,
  CONSTRAINT "SubActivity_pkey" PRIMARY KEY ("id")
);

-- Add relations/indexes
ALTER TABLE "public"."SubActivity"
  ADD CONSTRAINT "SubActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "SubActivity_activityId_name_key" ON "public"."SubActivity"("activityId","name");
