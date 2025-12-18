-- CreateTable
CREATE TABLE "public"."SubActivityImage" (
    "id" TEXT NOT NULL,
    "subActivityId" TEXT NOT NULL,
    "characterId" TEXT,
    "girlfriendId" TEXT,
    "strLevel" INTEGER NOT NULL,
    "img" TEXT NOT NULL,

    CONSTRAINT "SubActivityImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubActivityImage_subActivityId_characterId_strLevel_key" ON "public"."SubActivityImage"("subActivityId", "characterId", "strLevel");

-- CreateIndex
CREATE UNIQUE INDEX "SubActivityImage_subActivityId_girlfriendId_strLevel_key" ON "public"."SubActivityImage"("subActivityId", "girlfriendId", "strLevel");

-- AddForeignKey
ALTER TABLE "public"."SubActivityImage" ADD CONSTRAINT "SubActivityImage_subActivityId_fkey" FOREIGN KEY ("subActivityId") REFERENCES "public"."SubActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubActivityImage" ADD CONSTRAINT "SubActivityImage_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "public"."Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubActivityImage" ADD CONSTRAINT "SubActivityImage_girlfriendId_fkey" FOREIGN KEY ("girlfriendId") REFERENCES "public"."Girlfriend"("id") ON DELETE CASCADE ON UPDATE CASCADE;
