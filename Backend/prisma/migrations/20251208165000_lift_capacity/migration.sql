-- LiftCapacity table
CREATE TABLE IF NOT EXISTS "public"."LiftCapacity" (
  "id" TEXT NOT NULL,
  "strLevel" INTEGER NOT NULL,
  "bicepsCurl" INTEGER,
  "benchPress" INTEGER,
  "squat" INTEGER,
  "latPulldown" INTEGER,
  CONSTRAINT "LiftCapacity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LiftCapacity_strLevel_key" UNIQUE ("strLevel")
);
