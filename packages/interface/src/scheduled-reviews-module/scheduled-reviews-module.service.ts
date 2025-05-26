import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LearningActivitiesModuleService } from '../learning-activities-module/learning-activities-module.service';
import { ReviewSettingsService } from '../review-settings-module/review-settings-module.service';
import { CoursesModuleService } from '../courses-module/courses-module.service';
import { ScheduledReviewDto } from './dto/scheduled-review.dto';
import { MarkReviewAsDoneDto } from './dto/mark-review-as-done.dto';
import {
  LearningActivityType,
  ReviewRuleRepetition,
  ReviewRuleUnit,
  LearningActivity,
  ManualReviewEntry,
} from '../../generated/prisma';
import {
  addMinutes,
  addHours,
  addDays,
  addMonths,
  differenceInDays,
} from 'date-fns'; // 用于日期计算

@Injectable()
export class ScheduledReviewsModuleService {
  private readonly logger = new Logger(ScheduledReviewsModuleService.name);

  constructor(
    private prisma: PrismaService,
    private learningActivitiesService: LearningActivitiesModuleService,
    private reviewSettingsService: ReviewSettingsService, // 用于获取全局复习规则
    private coursesService: CoursesModuleService, // 用于获取课程详情
  ) {}

  /**
   * 计算并返回用户的待复习列表。
   * 这是核心的复杂逻辑所在。
   */
  async getScheduledReviews(userId: string): Promise<ScheduledReviewDto[]> {
    this.logger.log(`开始为用户 ${userId} 计算待复习列表`);
    const scheduledReviews: ScheduledReviewDto[] = [];

    // 1. 获取用户所有非默认课程 (isDefault=false)
    const userCourses = await this.prisma.course.findMany({
      where: { userId, isDefault: false },
      include: {
        // rules: true, // 如果课程可以有自己的复习规则 (当前schema.prisma中 ReviewRule 没有直接关联 Course)
      },
    });

    // 2. 获取用户的全局复习规则
    const globalReviewRules =
      await this.reviewSettingsService.getGlobalReviewRules(userId);
    if (!globalReviewRules || globalReviewRules.length === 0) {
      this.logger.log(`用户 ${userId} 没有全局复习规则，无法生成复习项。`);
    }

    // 3. 获取用户所有的学习活动
    const allLearningActivities = await this.prisma.learningActivity.findMany({
      where: { userId },
      orderBy: { activityTimestamp: 'asc' },
    });

    // 4. 获取用户的手动复习条目 (未完成的)
    const manualEntries = await this.prisma.manualReviewEntry.findMany({
      where: { userId, isCompleted: false },
      include: { course: true },
    });

    for (const entry of manualEntries) {
      if (entry.course) {
        scheduledReviews.push({
          id: `manual-${entry.id}`,
          courseId: entry.courseId,
          courseName: entry.course.name,
          scheduledAt: entry.reviewDate.toISOString(),
          originalLearningActivityId: undefined,
          reviewRuleId: undefined,
          ruleDescription: entry.title,
          repetitionCycle: undefined,
        });
      }
    }

    for (const course of userCourses) {
      const initialLearningActivity = allLearningActivities.find(
        (act) =>
          act.courseId === course.id &&
          act.activityType === LearningActivityType.INITIAL_LEARNING,
      );

      if (!initialLearningActivity) {
        this.logger.log(
          `课程 ${course.id} (${course.name}) 没有初始学习活动，跳过。`,
        );
        continue;
      }

      const initialTimestamp = new Date(
        initialLearningActivity.activityTimestamp,
      );

      for (const rule of globalReviewRules) {
        let nextReviewTimeLoop = initialTimestamp; // Use a different var for loop progression
        let repetitionCount = 0;

        do {
          repetitionCount++;
          const baseTimeForRuleCalculation =
            rule.repetition === ReviewRuleRepetition.LOOP && repetitionCount > 1
              ? nextReviewTimeLoop // Base on previous iteration for loops
              : initialTimestamp; // Base on initial learning for first cycle or ONCE

          const currentCalculatedReviewTime = this.calculateNextReviewTime(
            baseTimeForRuleCalculation,
            rule.value,
            rule.unit,
          );
          nextReviewTimeLoop = currentCalculatedReviewTime; // Update for next potential loop iteration

          const scheduledAtISO = currentCalculatedReviewTime.toISOString();

          const alreadyCompleted = allLearningActivities.some(
            (act) =>
              act.courseId === course.id &&
              act.activityType === LearningActivityType.REVIEW_COMPLETED &&
              differenceInDays(
                new Date(act.activityTimestamp),
                currentCalculatedReviewTime,
              ) === 0,
          );

          if (
            alreadyCompleted &&
            rule.repetition === ReviewRuleRepetition.ONCE
          ) {
            this.logger.log(
              `课程 ${course.name}, 规则 ${rule.value} ${rule.unit} (ONCE) 已完成.`,
            );
            break;
          }
          if (
            alreadyCompleted &&
            rule.repetition === ReviewRuleRepetition.LOOP
          ) {
            this.logger.log(
              `课程 ${course.name}, 规则 ${rule.value} ${rule.unit} (LOOP Cycle ${repetitionCount}) 已完成.`,
            );
            continue;
          }

          let ruleIdentifier: string;
          if (rule.id) {
            ruleIdentifier = rule.id;
          } else {
            ruleIdentifier = `global-${rule.value}${rule.unit}`;
          }

          scheduledReviews.push({
            id: `rule-${course.id}-${ruleIdentifier}-${repetitionCount}`,
            courseId: course.id,
            courseName: course.name,
            scheduledAt: scheduledAtISO,
            originalLearningActivityId: initialLearningActivity.id,
            reviewRuleId: rule.id,
            ruleDescription: `${rule.value} ${rule.unit}${rule.repetition === ReviewRuleRepetition.LOOP ? ` (周期 ${repetitionCount})` : ''}`,
            repetitionCycle:
              rule.repetition === ReviewRuleRepetition.LOOP
                ? repetitionCount
                : undefined,
          });

          if (rule.repetition === ReviewRuleRepetition.ONCE) {
            break;
          }
          if (
            repetitionCount >= 10 &&
            rule.repetition === ReviewRuleRepetition.LOOP
          ) {
            this.logger.warn(
              `用户 ${userId}, 课程 ${course.name}, 规则 ${ruleIdentifier} 达到10次循环上限.`,
            );
            break;
          }
        } while (
          rule.repetition === ReviewRuleRepetition.LOOP &&
          nextReviewTimeLoop < addMonths(new Date(), 12)
        );
      }
    }

    scheduledReviews.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
    this.logger.log(
      `为用户 ${userId} 计算得到 ${scheduledReviews.length} 个待复习项。`,
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
      default:
        this.logger.error(`Unsupported ReviewRuleUnit: ${unit}`);
        throw new Error(`Unsupported ReviewRuleUnit: ${unit}`);
    }
  }

  async markReviewAsDone(
    userId: string,
    markAsDoneDto: MarkReviewAsDoneDto,
  ): Promise<LearningActivity | ManualReviewEntry | null> {
    this.logger.log(
      `用户 ${userId} 标记复习项 ${markAsDoneDto.scheduledReviewId} 为完成。`,
    );
    const { scheduledReviewId, completedAt, notes } = markAsDoneDto;
    const actualCompletedAt = completedAt ? new Date(completedAt) : new Date();

    if (scheduledReviewId.startsWith('manual-')) {
      const manualEntryId = scheduledReviewId.replace('manual-', '');
      const entry = await this.prisma.manualReviewEntry.findUnique({
        where: { id: manualEntryId },
      });
      if (!entry)
        throw new NotFoundException(
          `ID 为 ${manualEntryId} 的手动复习条目未找到`,
        );
      if (entry.userId !== userId)
        throw new ForbiddenException('您无权修改此手动复习条目');

      return this.prisma.manualReviewEntry.update({
        where: { id: manualEntryId },
        data: {
          isCompleted: true,
          completedAt: actualCompletedAt,
        },
      });
    } else if (scheduledReviewId.startsWith('rule-')) {
      const parts = scheduledReviewId.split('-');
      if (parts.length < 4) {
        this.logger.error(
          `无效的 scheduledReviewId 格式: ${scheduledReviewId}`,
        );
        throw new BadRequestException('无效的 scheduledReviewId 格式');
      }
      const courseId = parts[1];

      const course = await this.prisma.course.findFirst({
        where: { id: courseId, userId },
      });
      if (!course)
        throw new NotFoundException(`课程 ID ${courseId} 未找到或您无权访问。`);

      return this.prisma.learningActivity.create({
        data: {
          userId,
          courseId: courseId,
          activityType: LearningActivityType.REVIEW_COMPLETED,
          activityTimestamp: actualCompletedAt,
          notes: notes || `Completed review for course ${course.name}`,
        },
      });
    } else {
      this.logger.error(`未知的 scheduledReviewId 格式: ${scheduledReviewId}`);
      throw new BadRequestException('未知的 scheduledReviewId 格式');
    }
  }
}
