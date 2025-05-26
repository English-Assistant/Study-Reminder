import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Course,
  ReviewRule,
  ReviewRuleUnit,
  ReviewRuleRepetition,
} from '../../generated/prisma';
import { SetGlobalReviewRulesDto } from './dto/set-global-review-rules.dto';
import { ReviewRuleDto } from './dto/review-rule.dto';

const DEFAULT_TEMPLATE_TITLE = '我的全局复习模板';

// 预设的通用复习规则 (如果用户没有自定义模板时返回)
const DEFAULT_REVIEW_RULES: ReviewRuleDto[] = [
  {
    value: 1,
    unit: ReviewRuleUnit.HOURS,
    repetition: ReviewRuleRepetition.ONCE,
  },
  {
    value: 1,
    unit: ReviewRuleUnit.DAYS,
    repetition: ReviewRuleRepetition.ONCE,
  },
  {
    value: 2,
    unit: ReviewRuleUnit.DAYS,
    repetition: ReviewRuleRepetition.ONCE,
  },
  {
    value: 4,
    unit: ReviewRuleUnit.DAYS,
    repetition: ReviewRuleRepetition.ONCE,
  },
  {
    value: 7,
    unit: ReviewRuleUnit.DAYS,
    repetition: ReviewRuleRepetition.ONCE,
  },
  {
    value: 15,
    unit: ReviewRuleUnit.DAYS,
    repetition: ReviewRuleRepetition.ONCE,
  },
  {
    value: 30,
    unit: ReviewRuleUnit.DAYS,
    repetition: ReviewRuleRepetition.ONCE,
  },
  {
    value: 60,
    unit: ReviewRuleUnit.DAYS,
    repetition: ReviewRuleRepetition.ONCE,
  },
  {
    value: 90,
    unit: ReviewRuleUnit.DAYS,
    repetition: ReviewRuleRepetition.ONCE,
  },
];

@Injectable()
export class ReviewSettingsService {
  private readonly logger = new Logger(ReviewSettingsService.name);

  constructor(private prisma: PrismaService) {}

  private async findOrCreateDefaultCourseTemplate(
    userId: string,
  ): Promise<Course> {
    let templateCourse = await this.prisma.course.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (!templateCourse) {
      this.logger.log(`用户 ${userId} 的全局复习模板课程不存在，正在创建...`);
      templateCourse = await this.prisma.course.create({
        data: {
          name: DEFAULT_TEMPLATE_TITLE,
          description: '用于存储全局复习规则的课程模板',
          color: '#808080',
          userId,
          isDefault: true,
        },
      });
      this.logger.log(
        `为用户 ${userId} 创建了ID为 ${templateCourse.id} 的全局模板课程。`,
      );
    }
    return templateCourse;
  }

  async getGlobalReviewRules(userId: string): Promise<ReviewRuleDto[]> {
    const templateCourse = await this.prisma.course.findFirst({
      where: {
        userId,
        isDefault: true,
      },
      include: {
        rules: true,
      },
    });

    if (
      !templateCourse ||
      !templateCourse.rules ||
      templateCourse.rules.length === 0
    ) {
      this.logger.log(
        `用户 ${userId} 未找到自定义全局复习规则，返回预设规则。`,
      );
      return DEFAULT_REVIEW_RULES;
    }

    return templateCourse.rules.map((rule) => ({
      id: rule.id,
      value: rule.value,
      unit: rule.unit,
      repetition: rule.repetition,
    }));
  }

  async setGlobalReviewRules(
    userId: string,
    setRulesDto: SetGlobalReviewRulesDto,
  ): Promise<ReviewRuleDto[]> {
    const templateCourse = await this.findOrCreateDefaultCourseTemplate(userId);

    const newRulesData = setRulesDto.rules.map((ruleDto) => ({
      value: ruleDto.value,
      unit: ruleDto.unit,
      repetition: ruleDto.repetition,
      courseId: templateCourse.id,
    }));

    const transactionResults = await this.prisma.$transaction(async (tx) => {
      await tx.reviewRule.deleteMany({
        where: { courseId: templateCourse.id },
      });
      this.logger.log(`已删除课程 ${templateCourse.id} 的旧复习规则。`);

      if (newRulesData.length === 0) {
        this.logger.log(`用户 ${userId} 设置了空的全局复习规则。`);
        return [];
      }

      await tx.reviewRule.createMany({
        data: newRulesData,
        skipDuplicates: true,
      });
      this.logger.log(
        `为课程 ${templateCourse.id} 创建了 ${newRulesData.length} 条新复习规则。`,
      );

      const updatedRules = await tx.reviewRule.findMany({
        where: { courseId: templateCourse.id },
        orderBy: { createdAt: 'asc' },
      });
      return updatedRules;
    });

    return transactionResults.map((rule) => ({
      id: rule.id,
      value: rule.value,
      unit: rule.unit,
      repetition: rule.repetition,
    }));
  }
}
