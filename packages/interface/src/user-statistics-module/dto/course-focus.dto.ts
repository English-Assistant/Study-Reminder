export class CourseFocusDto {
  courseId!: string;
  courseName!: string;
  courseColor?: string;
  totalLearningActivities!: number;
  totalReviewsCompletedOnCourse!: number; // Reviews specifically tied to this course's activities or rules
  totalManualEntriesOnCourse!: number; // Manual entries linked to this course
}
