import {
  Injectable,
  Logger,
  // NotFoundException, // No longer needed by markReviewAsDone
  // BadRequestException, // No longer needed by markReviewAsDone
  // ForbiddenException, // No longer needed by markReviewAsDone
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { LearningActivitiesModuleService } from '../learning-activities-module/learning-activities-module.service'; // REMOVED
import { ReviewSettingsService } from '../review-settings-module/review-settings-module.service';
// import { CoursesModuleService } from '../courses-module/courses-module.service'; // Not directly used
import { ScheduledReviewDto } from './dto/scheduled-review.dto';
// import { MarkReviewAsDoneDto } from './dto/mark-review-as-done.dto'; // REMOVED
import {
  // LearningActivityType, // REMOVED
  ReviewRuleRepetition,
  ReviewRuleUnit,
  // LearningActivity, // REMOVED
  // ManualReviewEntry, // REMOVED
} from '@prisma/client';
import {
  addMinutes,
  addHours,
  addDays,
  addMonths,
  // differenceInDays, // REMOVED
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';

@Injectable()
export class ScheduledReviewsModuleService {
  private readonly logger = new Logger(ScheduledReviewsModuleService.name);

  constructor(
    private prisma: PrismaService,
    // private learningActivitiesService: LearningActivitiesModuleService, // REMOVED
    private reviewSettingsService: ReviewSettingsService,
    // private coursesService: CoursesModuleService, // Not directly used
  ) {}

  async getScheduledReviews(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<ScheduledReviewDto[]> {
    this.logger.log(
      `开始为用户 ${userId} 计算待复习列表 (from: ${from}, to: ${to})`,
    );
    let scheduledReviews: ScheduledReviewDto[] = [];

    const userCourses = await this.prisma.course.findMany({
      where: { userId, isDefault: false }, // We only generate reviews for user's own non-default courses
    });

    const globalSettings =
      await this.reviewSettingsService.getGlobalSettings(userId);
    const globalReviewRules = globalSettings.rules;

    if (!globalReviewRules || globalReviewRules.length === 0) {
      this.logger.log(`用户 ${userId} 没有全局复习规则，可以跳过规则生成。`);
    }

    // Since LearningActivity is removed, we need a different way to get the initial learning date for courses.
    // For now, let's assume course.createdAt is the initial learning date.
    // This is a simplification and might need adjustment based on actual app logic for "when learning starts".

    const manualEntries = await this.prisma.manualReviewEntry.findMany({
      // where: { userId, isCompleted: false }, // isCompleted is removed
      where: { userId },
      include: { course: true },
    });

    for (const entry of manualEntries) {
      if (entry.course) {
        scheduledReviews.push({
          id: `manual-${entry.id}`,
          courseId: entry.courseId,
          courseName: entry.course.name,
          courseColor: entry.course.color,
          scheduledAt: entry.reviewDate.toISOString(),
          // originalLearningActivityId: undefined, // REMOVED
          reviewRuleId: undefined, // Manual entries don't have a rule ID in this context
          ruleDescription: entry.title, // Use title as description for manual entries
          repetitionCycle: undefined, // Manual entries are typically ONCE
          type: 'manual',
        });
      }
    }

    if (globalReviewRules && globalReviewRules.length > 0) {
      for (const course of userCourses) {
        // Use course.createdAt as the base for rule calculation
        const initialTimestamp = new Date(course.createdAt);

        for (const rule of globalReviewRules) {
          let nextReviewTimeLoop = initialTimestamp;
          let repetitionCount = 0;

          do {
            repetitionCount++;
            const baseTimeForRuleCalculation =
              rule.repetition === ReviewRuleRepetition.LOOP &&
              repetitionCount > 1
                ? nextReviewTimeLoop
                : initialTimestamp;

            const currentCalculatedReviewTime = this.calculateNextReviewTime(
              baseTimeForRuleCalculation,
              rule.value,
              rule.unit,
            );
            nextReviewTimeLoop = currentCalculatedReviewTime;

            const scheduledAtISO = currentCalculatedReviewTime.toISOString();

            // Since "completed" concept is removed, we don't check if a review was already completed.
            // Every calculated instance based on rules will be a potential review item.
            // The user decides if they reviewed it; the app just reminds.

            let ruleIdentifier: string;
            if (rule.id) {
              ruleIdentifier = rule.id;
            } else {
              // Fallback if rule.id is not present (e.g. for newly added rules not yet saved to DB)
              ruleIdentifier =
                `rule-${rule.value}${rule.unit}${rule.repetition}`.replace(
                  /\s+/g,
                  '',
                );
            }

            scheduledReviews.push({
              id: `rule-${course.id}-${ruleIdentifier}-${repetitionCount}`,
              courseId: course.id,
              courseName: course.name,
              courseColor: course.color,
              scheduledAt: scheduledAtISO,
              // originalLearningActivityId: initialLearningActivity.id, // REMOVED
              reviewRuleId: rule.id,
              ruleDescription: `${rule.description || rule.value + ' ' + rule.unit}${rule.repetition === ReviewRuleRepetition.LOOP ? ` (周期 ${repetitionCount})` : ''}`,
              repetitionCycle:
                rule.repetition === ReviewRuleRepetition.LOOP
                  ? repetitionCount
                  : undefined,
              type: 'rule-based',
            });

            if (rule.repetition === ReviewRuleRepetition.ONCE) {
              break;
            }
            if (
              repetitionCount >= 10 && // Safety break for loops
              rule.repetition === ReviewRuleRepetition.LOOP
            ) {
              this.logger.warn(
                `用户 ${userId}, 课程 ${course.name}, 规则 ${ruleIdentifier} 达到10次循环上限.`,
              );
              break;
            }
            // Limit loop to a reasonable future period, e.g., 2 years from now
          } while (
            rule.repetition === ReviewRuleRepetition.LOOP &&
            nextReviewTimeLoop < addMonths(new Date(), 24)
          );
        }
      }
    }

    if (from || to) {
      const fromDate = from ? startOfDay(parseISO(from)) : null;
      const toDate = to ? endOfDay(parseISO(to)) : null;

      scheduledReviews = scheduledReviews.filter((item) => {
        const itemDate = parseISO(item.scheduledAt);
        if (fromDate && itemDate < fromDate) {
          return false;
        }
        if (toDate && itemDate > toDate) {
          return false;
        }
        return true;
      });
    }

    scheduledReviews.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

    const finalCount: number = scheduledReviews.length;
    this.logger.log(
      `为用户 ${userId} 计算并过滤得到 ${finalCount} 个待复习项。`,
    );
    return scheduledReviews;
  }

  private calculateNextReviewTime(
    baseTime: Date,
    value: number,
    unit: ReviewRuleUnit,
  ): Date {
    switch (unit) {
      case ReviewRuleUnit.MINUTES:
        return addMinutes(baseTime, value);
      case ReviewRuleUnit.HOURS:
        return addHours(baseTime, value);
      case ReviewRuleUnit.DAYS:
        return addDays(baseTime, value);
      case ReviewRuleUnit.MONTHS:
        return addMonths(baseTime, value);
      default: {
        // Handle the 'never' case for exhaustiveness checking
        const exhaustiveCheck: never = unit;
        this.logger.error(
          `Unsupported ReviewRuleUnit encountered: ${String(exhaustiveCheck)}`,
        );
        throw new Error(`Unsupported ReviewRuleUnit encountered.`);
      }
    }
  }

  // Removed markReviewAsDone method
}
