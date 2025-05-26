export class DailyReviewActivityDto {
  date!: string; // YYYY-MM-DD
  reviewCount!: number;
  learningActivityCount!: number;
  manualEntryCount!: number; // Number of manual entries due or completed on this day
}
