-- DropForeignKey
ALTER TABLE "StudyRecord" DROP CONSTRAINT "StudyRecord_courseId_fkey";

-- AddForeignKey
ALTER TABLE "StudyRecord" ADD CONSTRAINT "StudyRecord_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
