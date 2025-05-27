/*
  Warnings:

  - You are about to drop the column `completedAt` on the `ManualReviewEntry` table. All the data in the column will be lost.
  - You are about to drop the column `isCompleted` on the `ManualReviewEntry` table. All the data in the column will be lost.
  - You are about to drop the column `isEnabled` on the `ReviewRule` table. All the data in the column will be lost.
  - You are about to drop the column `isSystemRule` on the `ReviewRule` table. All the data in the column will be lost.
  - You are about to drop the `LearningActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserCourseCompletion` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `globalSettingsId` to the `ReviewRule` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "LearningActivity" DROP CONSTRAINT "LearningActivity_courseId_fkey";

-- DropForeignKey
ALTER TABLE "LearningActivity" DROP CONSTRAINT "LearningActivity_userId_fkey";

-- DropForeignKey
ALTER TABLE "ReviewRule" DROP CONSTRAINT "ReviewRule_courseId_fkey";

-- DropForeignKey
ALTER TABLE "UserCourseCompletion" DROP CONSTRAINT "UserCourseCompletion_courseId_fkey";

-- DropForeignKey
ALTER TABLE "UserCourseCompletion" DROP CONSTRAINT "UserCourseCompletion_userId_fkey";

-- AlterTable
ALTER TABLE "ManualReviewEntry" DROP COLUMN "completedAt",
DROP COLUMN "isCompleted";

-- AlterTable
ALTER TABLE "ReviewRule" DROP COLUMN "isEnabled",
DROP COLUMN "isSystemRule",
ADD COLUMN     "globalSettingsId" TEXT NOT NULL,
ALTER COLUMN "courseId" DROP NOT NULL;

-- DropTable
DROP TABLE "LearningActivity";

-- DropTable
DROP TABLE "UserCourseCompletion";

-- DropEnum
DROP TYPE "LearningActivityType";

-- CreateTable
CREATE TABLE "UserGlobalSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "appNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGlobalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGlobalSettings_userId_key" ON "UserGlobalSettings"("userId");

-- AddForeignKey
ALTER TABLE "ReviewRule" ADD CONSTRAINT "ReviewRule_globalSettingsId_fkey" FOREIGN KEY ("globalSettingsId") REFERENCES "UserGlobalSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRule" ADD CONSTRAINT "ReviewRule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGlobalSettings" ADD CONSTRAINT "UserGlobalSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
