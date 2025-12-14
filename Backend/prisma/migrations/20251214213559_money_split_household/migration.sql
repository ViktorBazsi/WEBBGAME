/*
  Warnings:

  - You are about to drop the column `money` on the `Character` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Character" DROP COLUMN "money",
ADD COLUMN     "charMoney" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "householdMoney" INTEGER NOT NULL DEFAULT 500;

-- AlterTable
ALTER TABLE "public"."Girlfriend" ADD COLUMN     "girMoney" INTEGER NOT NULL DEFAULT 500;
