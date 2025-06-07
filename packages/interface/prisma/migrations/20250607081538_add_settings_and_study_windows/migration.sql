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

-- AddForeignKey
ALTER TABLE "StudyTimeWindow" ADD CONSTRAINT "StudyTimeWindow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
