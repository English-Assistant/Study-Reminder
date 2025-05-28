-- DropForeignKey
ALTER TABLE "ReviewRule" DROP CONSTRAINT "ReviewRule_userId_fkey";

-- DropIndex
DROP INDEX "ReviewRule_userId_key";

-- CreateTable
CREATE TABLE "ManualReviewEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualReviewEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManualReviewEntry_userId_courseId_idx" ON "ManualReviewEntry"("userId", "courseId");

-- CreateIndex
CREATE INDEX "ManualReviewEntry_userId_reviewDate_idx" ON "ManualReviewEntry"("userId", "reviewDate");

-- AddForeignKey
ALTER TABLE "ReviewRule" ADD CONSTRAINT "ReviewRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualReviewEntry" ADD CONSTRAINT "ManualReviewEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualReviewEntry" ADD CONSTRAINT "ManualReviewEntry_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
