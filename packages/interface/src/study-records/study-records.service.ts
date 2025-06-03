import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  StudyRecord,
  Prisma,
  ReviewRule,
  IntervalUnit,
  ReviewMode,
} from '@prisma/client';
import { CreateStudyRecordDto } from './dto/create-study-record.dto';
import { UpdateStudyRecordDto } from './dto/update-study-record.dto';
import * as dayjs from 'dayjs';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import {
  StudyRecordWithReviewsDto,
  UpcomingReviewInRecordDto,
} from './dto/study-record-with-reviews.dto';
import { isEmpty, sortBy } from 'lodash';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

@Injectable()
export class StudyRecordsService {
  private readonly logger = new Logger(StudyRecordsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    createStudyRecordDto: CreateStudyRecordDto,
  ): Promise<StudyRecord> {
    this.logger.log(
      `User ${userId} creating study record for course ${createStudyRecordDto.courseId}`,
    );
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: createStudyRecordDto.courseId },
      });
      if (!course) {
        throw new NotFoundException(
          `课程 ID ${createStudyRecordDto.courseId} 未找到。`,
        );
      }
      if (course.userId !== userId) {
        throw new ForbiddenException(
          `您无权访问课程 ID ${createStudyRecordDto.courseId}。`,
        );
      }

      const studiedAtDate = dayjs(createStudyRecordDto.studiedAt);
      if (!studiedAtDate.isValid()) {
        throw new BadRequestException('提供的 studiedAt 日期时间字符串无效。');
      }

      return await this.prisma.studyRecord.create({
        data: {
          userId,
          courseId: createStudyRecordDto.courseId,
          studiedAt: studiedAtDate.toDate(),
          textTitle: createStudyRecordDto.textTitle,
          note: createStudyRecordDto.note,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create study record for user ${userId}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('创建学习记录失败。');
    }
  }

  async findAllByUserId(
    userId: string,
    courseId?: string,
    filterDate?: string,
    addedWithinDays?: number,
  ): Promise<StudyRecord[]> {
    this.logger.log(
      `Fetching study records for user ${userId}, courseId: ${courseId}, filterDate: ${filterDate}, addedWithinDays: ${addedWithinDays}`,
    );
    const whereClause: Prisma.StudyRecordWhereInput = { userId };

    if (courseId) {
      whereClause.courseId = courseId;
    }

    if (filterDate) {
      const day = dayjs(filterDate, 'YYYY-MM-DD');
      if (!day.isValid()) {
        throw new BadRequestException(
          '提供的 filterDate 日期字符串无效或格式不正确 (应为 YYYY-MM-DD)。',
        );
      }
      const startDate = day.startOf('day').toDate();
      const endDate = day.endOf('day').toDate();
      whereClause.studiedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (addedWithinDays && addedWithinDays > 0) {
      const sinceDate = dayjs()
        .subtract(addedWithinDays, 'day')
        .startOf('day')
        .toDate();
      whereClause.createdAt = {
        gte: sinceDate,
      };
    }

    try {
      return await this.prisma.studyRecord.findMany({
        where: whereClause,
        orderBy: { studiedAt: 'desc' }, // 或 createdAt: 'desc' 如果主要关心添加顺序
        include: {
          course: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch study records for user ${userId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('获取学习记录列表失败。');
    }
  }

  async findOne(id: string, userId: string): Promise<StudyRecord | null> {
    this.logger.log(`Fetching study record ${id} for user ${userId}`);
    try {
      const record = await this.prisma.studyRecord.findUnique({
        where: { id },
      });
      if (!record) {
        throw new NotFoundException(`学习记录 ID ${id} 未找到。`);
      }
      if (record.userId !== userId) {
        throw new ForbiddenException('您无权访问此学习记录。');
      }
      return record;
    } catch (error) {
      this.logger.error(
        `Failed to fetch study record ${id} for user ${userId}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('获取学习记录详情失败。');
    }
  }

  async update(
    id: string,
    userId: string,
    updateStudyRecordDto: UpdateStudyRecordDto,
  ): Promise<StudyRecord> {
    this.logger.log(`User ${userId} updating study record ${id}`);
    await this.findOne(id, userId);

    const dataToUpdate: Prisma.StudyRecordUpdateInput = {};

    if (updateStudyRecordDto.courseId) {
      dataToUpdate.course = { connect: { id: updateStudyRecordDto.courseId } };
    }
    if (updateStudyRecordDto.textTitle) {
      dataToUpdate.textTitle = updateStudyRecordDto.textTitle;
    }
    if (updateStudyRecordDto.note) {
      dataToUpdate.note = updateStudyRecordDto.note;
    }
    if (updateStudyRecordDto.studiedAt) {
      const studiedAtDate = dayjs(updateStudyRecordDto.studiedAt);
      if (!studiedAtDate.isValid()) {
        throw new BadRequestException('提供的 studiedAt 日期时间字符串无效。');
      }
      dataToUpdate.studiedAt = studiedAtDate.toDate();
    }

    if (Object.keys(dataToUpdate).length === 0) {
      throw new BadRequestException('没有提供需要更新的字段。');
    }

    try {
      return await this.prisma.studyRecord.update({
        where: { id },
        data: dataToUpdate,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update study record ${id} for user ${userId}: ${error.message}`,
        error.stack,
      );
      if (error.code === 'P2025') {
        throw new NotFoundException(`学习记录 ID ${id} 更新失败，记录未找到。`);
      }
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('更新学习记录失败。');
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    this.logger.log(`User ${userId} deleting study record ${id}`);
    await this.findOne(id, userId);

    try {
      await this.prisma.studyRecord.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(
        `Failed to delete study record ${id} for user ${userId}: ${error.message}`,
        error.stack,
      );
      if (error.code === 'P2025') {
        throw new NotFoundException(`学习记录 ID ${id} 删除失败，记录未找到。`);
      }
      throw new InternalServerErrorException('删除学习记录失败。');
    }
  }

  async getConsecutiveStudyDays(userId: string): Promise<number> {
    const today = dayjs().startOf('day');
    const todayEnd = dayjs().endOf('day'); // 使用当天的结束时间

    const records = await this.prisma.studyRecord.findMany({
      where: {
        userId,
        studiedAt: {
          lte: todayEnd.toDate(), // 使用当天结束时间，确保包含今天的所有记录
        },
      },
      orderBy: {
        studiedAt: 'desc',
      },
      select: {
        studiedAt: true,
      },
    });

    // 让我们也查询一下这个用户的所有记录，不限制日期
    const allRecords = await this.prisma.studyRecord.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        studiedAt: true,
        textTitle: true,
      },
      orderBy: {
        studiedAt: 'desc',
      },
    });

    console.log('allRecords for user:', allRecords);

    if (records.length === 0) {
      return 0;
    }

    // 将所有学习日期转换为日期字符串集合
    const studyDates = new Set<string>();
    records.forEach((record) => {
      studyDates.add(dayjs(record.studiedAt).format('YYYY-MM-DD'));
    });

    let consecutiveDays = 0;
    let currentDate = today.clone();

    // 检查今天是否有打卡
    const todayStr = today.format('YYYY-MM-DD');
    if (studyDates.has(todayStr)) {
      // 今天有打卡，从1开始计算
      consecutiveDays = 1;
      currentDate = today.subtract(1, 'day'); // 从昨天开始检查
    } else {
      // 今天没有打卡，从0开始，但检查昨天开始的连续天数
      consecutiveDays = 0;
      currentDate = today.subtract(1, 'day'); // 从昨天开始检查
    }

    // 向前查找连续的打卡日期
    while (studyDates.has(currentDate.format('YYYY-MM-DD'))) {
      consecutiveDays++;
      currentDate = currentDate.subtract(1, 'day');
    }

    return consecutiveDays;
  }

  private calculateNextReviewTime(
    studiedAt: Date,
    rule: ReviewRule,
  ): dayjs.Dayjs | null {
    const baseTime = dayjs(studiedAt).second(0).millisecond(0);
    const expectedTime = this.addInterval(baseTime, rule.value, rule.unit);

    if (rule.mode === ReviewMode.ONCE) {
      return expectedTime;
    }

    if (rule.mode === ReviewMode.RECURRING) {
      return expectedTime;
    }
    return null;
  }

  private addInterval(
    date: dayjs.Dayjs,
    value: number,
    unit: IntervalUnit,
  ): dayjs.Dayjs {
    let dayjsUnit: dayjs.ManipulateType;
    switch (unit) {
      case IntervalUnit.MINUTE:
        dayjsUnit = 'minute';
        break;
      case IntervalUnit.HOUR:
        dayjsUnit = 'hour';
        break;
      case IntervalUnit.DAY:
        dayjsUnit = 'day';
        break;
      default:
        this.logger.warn(`Unsupported IntervalUnit: ${String(unit)}`);
        return date;
    }
    return date.add(value, dayjsUnit);
  }

  private getRuleDescription(rule: ReviewRule): string {
    const unitMap = {
      [IntervalUnit.MINUTE]: '分钟',
      [IntervalUnit.HOUR]: '小时',
      [IntervalUnit.DAY]: '天',
    };
    const modeMap = {
      [ReviewMode.ONCE]: '一次性',
      [ReviewMode.RECURRING]: '周期性',
    };
    return `${rule.value} ${unitMap[rule.unit]}后 (${modeMap[rule.mode]}) - ${rule.note || '无备注'}`;
  }

  async getStudyRecordsAndReviewsByMonth(
    userId: string,
    year: number,
    month: number, // 1-indexed
  ): Promise<StudyRecordWithReviewsDto[]> {
    this.logger.log(
      `Fetching study records and reviews for user ${userId} for ${year}-${month}`,
    );

    const monthStart = dayjs(`${year}-${month}-01`).startOf('month');
    const monthEnd = monthStart.endOf('month');

    const studyRecordSelectScope = {
      id: true,
      userId: true,
      courseId: true,
      textTitle: true,
      note: true,
      studiedAt: true,
      createdAt: true,
      course: {
        select: {
          id: true,
          name: true,
          color: true,
          note: true,
        },
      },
    };

    // 获取当月创建的学习记录
    const recordsInMonthModels = await this.prisma.studyRecord.findMany({
      where: {
        userId,
        createdAt: {
          gte: monthStart.toDate(),
          lte: monthEnd.toDate(),
        },
      },
      select: studyRecordSelectScope,
      orderBy: {
        studiedAt: 'asc',
      },
    });

    // 获取复习规则
    const reviewRules = await this.prisma.reviewRule.findMany({
      where: { userId },
    });

    // 如果没有复习规则，直接返回学习记录
    if (isEmpty(reviewRules)) {
      return recordsInMonthModels.map(this.mapToDto);
    }

    // 获取所有学习记录（用于计算复习计划）
    const allStudyRecordsWithCourse = await this.prisma.studyRecord.findMany({
      where: { userId },
      select: studyRecordSelectScope,
    });

    // 初始化结果映射
    const recordsInMonthMap = new Map<string, StudyRecordWithReviewsDto>();
    recordsInMonthModels.forEach((record) => {
      recordsInMonthMap.set(record.id, this.mapToDto(record));
    });

    // 计算复习计划
    this.calculateReviewsForRecords(
      allStudyRecordsWithCourse,
      reviewRules,
      monthStart,
      monthEnd,
      recordsInMonthMap,
    );

    // 排序并返回结果
    const finalResults = Array.from(recordsInMonthMap.values()).map(
      (record) => ({
        ...record,
        upcomingReviewsInMonth: sortBy(
          record.upcomingReviewsInMonth,
          (review) => dayjs(review.expectedReviewAt).valueOf(),
        ),
      }),
    );

    return sortBy(finalResults, (record) => dayjs(record.studiedAt).valueOf());
  }

  private mapToDto = (record: {
    id: string;
    userId: string;
    courseId: string;
    textTitle: string;
    note: string | null;
    studiedAt: Date;
    createdAt: Date;
    course: {
      id: string;
      name: string;
      color: string | null;
      note: string | null;
    } | null;
  }): StudyRecordWithReviewsDto => ({
    id: record.id,
    userId: record.userId,
    courseId: record.courseId,
    textTitle: record.textTitle,
    note: record.note,
    studiedAt: record.studiedAt,
    createdAt: record.createdAt,
    course: record.course
      ? {
          id: record.course.id,
          name: record.course.name,
          color: record.course.color,
          note: record.course.note,
        }
      : null,
    upcomingReviewsInMonth: [],
  });

  private calculateReviewsForRecords(
    allStudyRecords: Array<{
      id: string;
      userId: string;
      courseId: string;
      textTitle: string;
      note: string | null;
      studiedAt: Date;
      createdAt: Date;
      course: {
        id: string;
        name: string;
        color: string | null;
        note: string | null;
      } | null;
    }>,
    reviewRules: ReviewRule[],
    monthStart: dayjs.Dayjs,
    monthEnd: dayjs.Dayjs,
    recordsInMonthMap: Map<string, StudyRecordWithReviewsDto>,
  ): void {
    // 过滤掉没有课程信息的记录，并确保类型安全
    const validRecords = allStudyRecords.filter(
      (
        record,
      ): record is {
        id: string;
        userId: string;
        courseId: string;
        textTitle: string;
        note: string | null;
        studiedAt: Date;
        createdAt: Date;
        course: {
          id: string;
          name: string;
          color: string | null;
          note: string | null;
        };
      } => {
        if (!record.course) {
          this.logger.warn(
            `Study record ${record.id} (title: ${record.textTitle}) for user ${record.userId} is missing course data. Skipping for review calculation.`,
          );
          return false;
        }
        return true;
      },
    );

    // 为每个记录和规则计算复习计划
    validRecords.forEach((record) => {
      reviewRules.forEach((rule) => {
        const reviewItems = this.calculateReviewsForRule(
          {
            id: record.id,
            textTitle: record.textTitle,
            studiedAt: record.studiedAt,
            course: record.course,
          },
          rule,
          monthStart,
          monthEnd,
        );

        // 将复习计划添加到对应的记录中
        reviewItems.forEach((reviewItem) => {
          const targetRecord = recordsInMonthMap.get(record.id);
          if (targetRecord) {
            targetRecord.upcomingReviewsInMonth.push(reviewItem);
          }
        });
      });
    });
  }

  private calculateReviewsForRule(
    record: {
      id: string;
      textTitle: string;
      studiedAt: Date;
      course: {
        id: string;
        name: string;
        color: string | null;
        note: string | null;
      };
    },
    rule: ReviewRule,
    monthStart: dayjs.Dayjs,
    monthEnd: dayjs.Dayjs,
  ): UpcomingReviewInRecordDto[] {
    const baseTime = dayjs(record.studiedAt).second(0).millisecond(0);
    const firstReviewTime = this.addInterval(baseTime, rule.value, rule.unit);

    const reviews: UpcomingReviewInRecordDto[] = [];

    if (rule.mode === ReviewMode.ONCE) {
      if (
        firstReviewTime.isSameOrAfter(monthStart) &&
        firstReviewTime.isSameOrBefore(monthEnd)
      ) {
        reviews.push(this.createReviewItem(record, rule, firstReviewTime));
      }
    } else if (rule.mode === ReviewMode.RECURRING) {
      let currentReviewTime = firstReviewTime;
      let iterationCount = 0;
      const maxIterations = 1000; // 防止无限循环

      while (
        currentReviewTime.isSameOrBefore(monthEnd) &&
        iterationCount < maxIterations
      ) {
        if (
          currentReviewTime.isSameOrAfter(monthStart) &&
          currentReviewTime.isSameOrAfter(baseTime)
        ) {
          reviews.push(this.createReviewItem(record, rule, currentReviewTime));
        }

        const nextReviewTime = this.addInterval(
          currentReviewTime,
          rule.value,
          rule.unit,
        );

        // 防止无限循环
        if (nextReviewTime.isSame(currentReviewTime)) {
          this.logger.warn(
            `Potential infinite loop detected for record ${record.id} and rule ${rule.id} at time ${currentReviewTime.toISOString()}. Breaking.`,
          );
          break;
        }

        currentReviewTime = nextReviewTime;
        iterationCount++;
      }

      if (iterationCount >= maxIterations) {
        this.logger.warn(
          `Maximum iterations reached for record ${record.id} and rule ${rule.id}. Possible infinite loop prevented.`,
        );
      }
    }

    return reviews;
  }

  private createReviewItem(
    record: {
      id: string;
      textTitle: string;
      course: {
        id: string;
        name: string;
        color: string | null;
        note: string | null;
      };
    },
    rule: ReviewRule,
    reviewTime: dayjs.Dayjs,
  ): UpcomingReviewInRecordDto {
    return {
      studyRecordId: record.id,
      textTitle: record.textTitle,
      course: {
        id: record.course.id,
        name: record.course.name,
        color: record.course.color,
        note: record.course.note,
      },
      expectedReviewAt: reviewTime.toDate(),
      ruleId: rule.id,
      ruleDescription: this.getRuleDescription(rule),
    };
  }
}
