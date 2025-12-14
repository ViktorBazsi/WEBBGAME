-- CreateTable
CREATE TABLE "public"."Achievement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_CharacterAchievements" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CharacterAchievements_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_GirlfriendAchievements" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GirlfriendAchievements_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_name_key" ON "public"."Achievement"("name");

-- CreateIndex
CREATE INDEX "_CharacterAchievements_B_index" ON "public"."_CharacterAchievements"("B");

-- CreateIndex
CREATE INDEX "_GirlfriendAchievements_B_index" ON "public"."_GirlfriendAchievements"("B");

-- AddForeignKey
ALTER TABLE "public"."_CharacterAchievements" ADD CONSTRAINT "_CharacterAchievements_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CharacterAchievements" ADD CONSTRAINT "_CharacterAchievements_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GirlfriendAchievements" ADD CONSTRAINT "_GirlfriendAchievements_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GirlfriendAchievements" ADD CONSTRAINT "_GirlfriendAchievements_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Girlfriend"("id") ON DELETE CASCADE ON UPDATE CASCADE;
