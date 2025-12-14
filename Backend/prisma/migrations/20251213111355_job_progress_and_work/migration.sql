-- CreateTable
CREATE TABLE "public"."CharacterJobProgress" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentXp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CharacterJobProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GirlfriendJobProgress" (
    "id" TEXT NOT NULL,
    "girlfriendId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentXp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GirlfriendJobProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterJobProgress_characterId_jobId_key" ON "public"."CharacterJobProgress"("characterId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "GirlfriendJobProgress_girlfriendId_jobId_key" ON "public"."GirlfriendJobProgress"("girlfriendId", "jobId");

-- AddForeignKey
ALTER TABLE "public"."CharacterJobProgress" ADD CONSTRAINT "CharacterJobProgress_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CharacterJobProgress" ADD CONSTRAINT "CharacterJobProgress_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GirlfriendJobProgress" ADD CONSTRAINT "GirlfriendJobProgress_girlfriendId_fkey" FOREIGN KEY ("girlfriendId") REFERENCES "public"."Girlfriend"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GirlfriendJobProgress" ADD CONSTRAINT "GirlfriendJobProgress_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
