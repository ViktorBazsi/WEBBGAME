-- DropForeignKey
ALTER TABLE "public"."SubActivity" DROP CONSTRAINT "SubActivity_activityId_fkey";

-- AddForeignKey
ALTER TABLE "public"."SubActivity" ADD CONSTRAINT "SubActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
