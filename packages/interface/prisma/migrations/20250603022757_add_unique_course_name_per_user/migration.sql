/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `Course` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Course_userId_name_key" ON "Course"("userId", "name");
