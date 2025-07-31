-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "money" INTEGER NOT NULL DEFAULT 500,
    "day" TEXT NOT NULL DEFAULT 'Monday',
    "time" INTEGER NOT NULL DEFAULT 8,
    "locationId" TEXT,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Stats" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "str" INTEGER,
    "dex" INTEGER,
    "int" INTEGER,
    "char" INTEGER,
    "weight" INTEGER,
    "height" INTEGER,

    CONSTRAINT "Stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Girlfriend" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "corruption" INTEGER NOT NULL DEFAULT 0,
    "affection" INTEGER NOT NULL DEFAULT 75,
    "locationId" TEXT,

    CONSTRAINT "Girlfriend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GfStats" (
    "id" TEXT NOT NULL,
    "gfId" TEXT NOT NULL,
    "str" INTEGER,
    "dex" INTEGER,
    "int" INTEGER,
    "char" INTEGER,
    "weight" INTEGER,
    "height" INTEGER,

    CONSTRAINT "GfStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Job" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requirement" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xpNeeded" INTEGER NOT NULL DEFAULT 50,
    "xpGained" INTEGER NOT NULL DEFAULT 10,
    "length" INTEGER NOT NULL,
    "money" INTEGER NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Activity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requirement" TEXT,
    "description" TEXT NOT NULL,
    "img" TEXT,
    "level" INTEGER DEFAULT 1,
    "xpNeeded" INTEGER DEFAULT 50,
    "xpGained" INTEGER DEFAULT 10,
    "length" INTEGER NOT NULL,
    "reward" INTEGER,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "img" TEXT,
    "requirement" TEXT,
    "description" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_CharacterJobs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CharacterJobs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_GirlfriendJobs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GirlfriendJobs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_LocationActivity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LocationActivity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "_CharacterJobs_B_index" ON "public"."_CharacterJobs"("B");

-- CreateIndex
CREATE INDEX "_GirlfriendJobs_B_index" ON "public"."_GirlfriendJobs"("B");

-- CreateIndex
CREATE INDEX "_LocationActivity_B_index" ON "public"."_LocationActivity"("B");

-- AddForeignKey
ALTER TABLE "public"."Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Character" ADD CONSTRAINT "Character_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Stats" ADD CONSTRAINT "Stats_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Girlfriend" ADD CONSTRAINT "Girlfriend_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Girlfriend" ADD CONSTRAINT "Girlfriend_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GfStats" ADD CONSTRAINT "GfStats_gfId_fkey" FOREIGN KEY ("gfId") REFERENCES "public"."Girlfriend"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CharacterJobs" ADD CONSTRAINT "_CharacterJobs_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CharacterJobs" ADD CONSTRAINT "_CharacterJobs_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GirlfriendJobs" ADD CONSTRAINT "_GirlfriendJobs_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Girlfriend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GirlfriendJobs" ADD CONSTRAINT "_GirlfriendJobs_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_LocationActivity" ADD CONSTRAINT "_LocationActivity_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_LocationActivity" ADD CONSTRAINT "_LocationActivity_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
