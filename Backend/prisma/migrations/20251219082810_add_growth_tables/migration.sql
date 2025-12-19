-- CreateTable
CREATE TABLE "public"."MeasurementsGrowth" (
    "id" TEXT NOT NULL,
    "gender" "public"."Gender",
    "weightFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    "heightFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.05,
    "bicepsFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    "chestFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    "quadsFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    "calvesFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    "backFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.1,

    CONSTRAINT "MeasurementsGrowth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LiftGrowth" (
    "id" TEXT NOT NULL,
    "gender" "public"."Gender",
    "bicepsCurlFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    "benchPressFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    "squatFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    "latPulldownFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.1,

    CONSTRAINT "LiftGrowth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EnduranceGrowth" (
    "id" TEXT NOT NULL,
    "gender" "public"."Gender",
    "distanceFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.1,

    CONSTRAINT "EnduranceGrowth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeasurementsGrowth_gender_key" ON "public"."MeasurementsGrowth"("gender");

-- CreateIndex
CREATE UNIQUE INDEX "LiftGrowth_gender_key" ON "public"."LiftGrowth"("gender");

-- CreateIndex
CREATE UNIQUE INDEX "EnduranceGrowth_gender_key" ON "public"."EnduranceGrowth"("gender");
