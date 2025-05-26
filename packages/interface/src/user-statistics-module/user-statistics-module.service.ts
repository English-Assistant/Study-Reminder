import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserOverallStatsDto } from './dto/user-overall-stats.dto';
import { ActivityStreakDto } from './dto/activity-streak.dto';
import { DailyReviewActivityDto } from './dto/daily-review-activity.dto';
import { CourseFocusDto } from './dto/course-focus.dto';
import { LearningActivitiesModuleService } from '../learning-activities-module/learning-activities-module.service';
import { UserCourseProgressModuleService } from '../user-course-progress-module/user-course-progress-module.service';
import {
  endOfDay,
  startOfDay,
  subDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  parseISO,
} from 'date-fns';
import { LearningActivityType } from '../../generated/prisma';

@Injectable()
export class UserStatisticsModuleService {
  private readonly logger = new Logger(UserStatisticsModuleService.name);

  constructor(
    private prisma: PrismaService,
    private learningActivitiesService: LearningActivitiesModuleService, // For learning activity counts
    private userCourseProgressService: UserCourseProgressModuleService, // For completed courses count
  ) {}

  async getOverallStats(userId: string): Promise<UserOverallStatsDto> {
    const totalReviewsCompleted = await this.prisma.manualReviewEntry.count({
      where: {
        userId,
        isCompleted: true,
      },
    });

    // Assuming scheduled reviews are marked by creating a LearningActivity of type REVIEW
    // This might need adjustment based on how ScheduledReviews are fully implemented.
    // For now, let's count all learning activities as "activities" and completed manual reviews as "reviews completed".

    const totalLearningActivities = await this.prisma.learningActivity.count({
      where: { userId },
    });

    const completedCourses =
      await this.userCourseProgressService.getCompletedCourses(userId);
    const totalCoursesCompleted = completedCourses.length;

    const totalManualEntries = await this.prisma.manualReviewEntry.count({
      where: { userId },
    });

    return {
      totalReviewsCompleted,
      totalLearningActivities,
      totalCoursesCompleted,
      totalManualEntries,
    };
  }

  async getActivityStreak(userId: string): Promise<ActivityStreakDto> {
    const learningActivitiesDates = (
      await this.prisma.learningActivity.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
    ).map((la) => format(startOfDay(la.createdAt), 'yyyy-MM-dd'));

    const manualEntriesCompletionDates = (
      await this.prisma.manualReviewEntry.findMany({
        where: { userId, isCompleted: true, completedAt: { not: null } },
        select: { completedAt: true }, // Ensure completedAt is not null for type safety
        orderBy: { completedAt: 'asc' },
      })
    ).map((me) => format(startOfDay(me.completedAt!), 'yyyy-MM-dd'));

    const allActivityDates = [
      ...new Set([...learningActivitiesDates, ...manualEntriesCompletionDates]),
    ].sort();

    if (allActivityDates.length === 0) {
      return {
        currentStreakInDays: 0,
        longestStreakInDays: 0,
        lastActivityDate: undefined,
      };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let lastActivityDate = parseISO(allActivityDates[0]);

    // Check if the first activity date is today or yesterday for current streak
    const today = startOfDay(new Date());
    if (differenceInCalendarDays(today, lastActivityDate) <= 1) {
      currentStreak = 1;
    }
    longestStreak = 1; // min longest streak is 1 if there is any activity

    for (let i = 0; i < allActivityDates.length; i++) {
      const activityDate = parseISO(allActivityDates[i]);
      if (i > 0) {
        const prevActivityDate = parseISO(allActivityDates[i - 1]);
        const diff = differenceInCalendarDays(activityDate, prevActivityDate);
        if (diff === 1) {
          currentStreak++;
        } else if (diff > 1) {
          // Reset current streak if gap is more than 1 day
          // But only if the current activity is not today or yesterday relative to loop start
          // This part of logic for current streak needs to be careful
          currentStreak = 1; // Reset if there's a gap
        }
      }
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      lastActivityDate = activityDate; // Keep track of the latest activity date encountered
    }

    // Final check for current streak: if the latest activity date is not today or yesterday, current streak is 0
    // unless there was only one activity and it was today/yesterday.
    const latestActivityDateInSet = parseISO(
      allActivityDates[allActivityDates.length - 1],
    );
    const daysSinceLastActivity = differenceInCalendarDays(
      today,
      latestActivityDateInSet,
    );

    if (daysSinceLastActivity > 1) {
      currentStreak = 0;
    } else if (allActivityDates.length === 1 && daysSinceLastActivity <= 1) {
      currentStreak = 1;
    } else if (daysSinceLastActivity === 0 || daysSinceLastActivity === 1) {
      // if the loop correctly calculated currentStreak ending on today/yesterday, it is fine.
      // if last activity was today/yesterday, but streak was broken before, re-calculate based on trailing activities
      let tempStreak = 0;
      if (daysSinceLastActivity <= 1) tempStreak = 1;
      for (let i = allActivityDates.length - 2; i >= 0; i--) {
        const d1 = parseISO(allActivityDates[i + 1]);
        const d2 = parseISO(allActivityDates[i]);
        if (differenceInCalendarDays(d1, d2) === 1) {
          tempStreak++;
        } else {
          break;
        }
      }
      currentStreak = tempStreak;
    }

    return {
      currentStreakInDays: currentStreak,
      longestStreakInDays: longestStreak,
      lastActivityDate: format(latestActivityDateInSet, 'yyyy-MM-dd'),
    };
  }

  async getReviewActivity(
    userId: string,
    periodDays: number = 7,
  ): Promise<DailyReviewActivityDto[]> {
    const endDate = startOfDay(new Date()); // Today
    const startDate = startOfDay(subDays(endDate, periodDays - 1)); // Go back periodDays-1 to include today

    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    const dateMap: Map<string, DailyReviewActivityDto> = new Map();

    // Initialize map for all dates in range
    for (const date of dateRange) {
      const dateString = format(date, 'yyyy-MM-dd');
      dateMap.set(dateString, {
        date: dateString,
        reviewCount: 0, // Specific reviews
        learningActivityCount: 0, // All learning activities
        manualEntryCount: 0, // Manual entries (due or relevant for this day)
      });
    }

    // Fetch all learning activities in the period
    const learningActivities = await this.prisma.learningActivity.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endOfDay(endDate), // include whole of endDate
        },
      },
    });

    for (const activity of learningActivities) {
      const activityDateString = format(
        startOfDay(activity.createdAt),
        'yyyy-MM-dd',
      );
      if (dateMap.has(activityDateString)) {
        const dayData = dateMap.get(activityDateString)!;
        dayData.learningActivityCount++;
        if (activity.activityType === LearningActivityType.REVIEW_COMPLETED) {
          dayData.reviewCount++;
        }
      }
    }

    // Fetch completed manual review entries in the period
    const completedManualReviews = await this.prisma.manualReviewEntry.findMany(
      {
        where: {
          userId,
          isCompleted: true,
          completedAt: {
            gte: startDate,
            lte: endOfDay(endDate),
          },
        },
      },
    );

    for (const entry of completedManualReviews) {
      if (entry.completedAt) {
        // Should always be true due to query
        const completionDateString = format(
          startOfDay(entry.completedAt),
          'yyyy-MM-dd',
        );
        if (dateMap.has(completionDateString)) {
          // Counting a completed manual review as a specific "review" action
          dateMap.get(completionDateString)!.reviewCount++;
        }
      }
    }

    // Fetch manual entries scheduled/due in the period (regardless of completion)
    const dueManualEntries = await this.prisma.manualReviewEntry.findMany({
      where: {
        userId,
        reviewDate: {
          // reviewDate is stored as DateTime but used as Date
          gte: startDate,
          lte: endOfDay(endDate),
        },
      },
    });

    for (const entry of dueManualEntries) {
      const dueDateString = format(startOfDay(entry.reviewDate), 'yyyy-MM-dd');
      if (dateMap.has(dueDateString)) {
        dateMap.get(dueDateString)!.manualEntryCount++;
      }
    }

    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  async getCourseFocusStats(userId: string): Promise<CourseFocusDto[]> {
    const userCourses = await this.prisma.course.findMany({
      where: { userId },
      // include: { _count: { select: { learningActivities: true, manualReviewEntries: true } } } // Prisma can count relations
    });

    const stats: CourseFocusDto[] = [];

    for (const course of userCourses) {
      const totalLearningActivities = await this.prisma.learningActivity.count({
        where: {
          courseId: course.id,
          // userId: userId, // Implicitly user's course, so activities on it are user's
        },
      });

      const totalManualEntriesOnCourse =
        await this.prisma.manualReviewEntry.count({
          where: {
            courseId: course.id,
            // userId: userId,
          },
        });

      // Count completed reviews associated with this course
      // 1. LearningActivities of type REVIEW_COMPLETED for this course
      const learningActivityReviews = await this.prisma.learningActivity.count({
        where: {
          courseId: course.id,
          activityType: LearningActivityType.REVIEW_COMPLETED,
        },
      });

      // 2. Completed ManualReviewEntries for this course
      const manualReviewCompletions = await this.prisma.manualReviewEntry.count(
        {
          where: {
            courseId: course.id,
            isCompleted: true,
          },
        },
      );

      stats.push({
        courseId: course.id,
        courseName: course.name,
        courseColor: course.color,
        totalLearningActivities,
        totalManualEntriesOnCourse,
        totalReviewsCompletedOnCourse:
          learningActivityReviews + manualReviewCompletions,
      });
    }

    return stats.sort(
      (a, b) =>
        b.totalLearningActivities +
        b.totalReviewsCompletedOnCourse -
        (a.totalLearningActivities + a.totalReviewsCompletedOnCourse),
    ); // Sort by most activity
  }
}
