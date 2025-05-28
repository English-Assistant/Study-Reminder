/*
  Warnings:

  - You are about to drop the column `studyDate` on the `StudyRecord` table. All the data in the column will be lost.
  - You are about to drop the column `timeHour` on the `StudyRecord` table. All the data in the column will be lost.
  - You are about to drop the column `timeMinute` on the `StudyRecord` table. All the data in the column will be lost.
  - You are about to drop the `ManualReviewEntry` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `studiedAt` to the `StudyRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ManualReviewEntry" DROP CONSTRAINT "ManualReviewEntry_courseId_fkey";

-- DropForeignKey
ALTER TABLE "ManualReviewEntry" DROP CONSTRAINT "ManualReviewEntry_userId_fkey";

-- DropIndex
DROP INDEX "StudyRecord_userId_studyDate_idx";

-- AlterTable
ALTER TABLE "StudyRecord" DROP COLUMN "studyDate",
DROP COLUMN "timeHour",
DROP COLUMN "timeMinute",
ADD COLUMN     "studiedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "ManualReviewEntry";

-- CreateIndex
CREATE INDEX "StudyRecord_userId_studiedAt_idx" ON "StudyRecord"("userId", "studiedAt");
