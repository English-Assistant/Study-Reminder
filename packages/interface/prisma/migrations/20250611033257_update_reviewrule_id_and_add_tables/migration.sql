/*
  Warnings:

  - The primary key for the `ReviewRule` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ReviewRule` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ReviewRule" DROP CONSTRAINT "ReviewRule_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ReviewRule_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "StudyTimeWindow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "StudyTimeWindow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyTimeWindow_userId_idx" ON "StudyTimeWindow"("userId");

-- CreateIndex
CREATE INDEX "ReviewRule_userId_idx" ON "ReviewRule"("userId");

-- AddForeignKey
ALTER TABLE "StudyTimeWindow" ADD CONSTRAINT "StudyTimeWindow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
