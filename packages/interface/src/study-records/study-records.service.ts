import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudyRecord, Prisma, ReviewRule, ReviewMode } from '@prisma/client';
import { CreateStudyRecordDto } from './dto/create-study-record.dto';
import { UpdateStudyRecordDto } from './dto/update-study-record.dto';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import {
  StudyRecordWithReviewsDto,
  UpcomingReviewInRecordDto,
} from './dto/study-record-with-reviews.dto';
import { isEmpty, sortBy, groupBy, map, orderBy } from 'lodash';
import { getRuleDescription } from '../common/review-rule.util';
import { addInterval } from '../common/date.util';
import { GroupedStudyRecordsDto } from './dto/grouped-study-records.dto';

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
      `用户 ${userId} 正在为课程 ${createStudyRecordDto.courseId} 创建学习记录`,
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
        `为用户 ${userId} 创建学习记录失败：${error.message}`,
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
  ): Promise<GroupedStudyRecordsDto[]> {
    this.logger.log(
      `正在获取用户 ${userId} 的学习记录，课程ID：${courseId}，过滤日期：${filterDate}，添加天数范围：${addedWithinDays}`,
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
      const records = await this.prisma.studyRecord.findMany({
        where: whereClause,
        include: {
          course: true,
        },
      });

      const groupedByDate = groupBy(records, (record) =>
        dayjs(record.studiedAt).format('YYYY-MM-DD'),
      );

      const result = map(groupedByDate, (dayRecords, date) => ({
        date,
        records: orderBy(dayRecords, ['studiedAt'], ['desc']),
      }));

      return orderBy(result, ['date'], ['desc']);
    } catch (error) {
      this.logger.error(
        `获取用户 ${userId} 的学习记录失败：${error.message}`,
        error.stack,
      );
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('获取学习记录列表失败。');
    }
  }

  async countAllByUserId(userId: string): Promise<{ count: number }> {
    this.logger.log(`正在为用户 ${userId} 计算学习记录总数`);
    try {
      const count = await this.prisma.studyRecord.count({
        where: { userId },
      });
      return { count };
    } catch (error) {
      this.logger.error(
        `为用户 ${userId} 计算学习记录总数失败: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('无法计算学习记录总数。');
    }
  }

  async findOne(id: string, userId: string): Promise<StudyRecord | null> {
    this.logger.log(`正在获取用户 ${userId} 的学习记录 ${id}`);
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
        `获取用户 ${userId} 的学习记录 ${id} 失败：${error.message}`,
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
    this.logger.log(`用户 ${userId} 正在更新学习记录 ${id}`);
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
        `更新用户 ${userId} 的学习记录 ${id} 失败：${error.message}`,
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
    this.logger.log(`用户 ${userId} 正在删除学习记录 ${id}`);
    await this.findOne(id, userId);

    try {
      await this.prisma.studyRecord.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(
        `删除用户 ${userId} 的学习记录 ${id} 失败：${error.message}`,
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

    await this.prisma.studyRecord.findMany({
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

  async getStudyRecordsAndReviewsByMonth(
    userId: string,
    year: number,
    month: number, // 1-indexed
  ): Promise<StudyRecordWithReviewsDto[]> {
    this.logger.log(
      `正在获取用户 ${userId} 在 ${year}年${month}月的学习记录和复习计划`,
    );

    const monthStart = dayjs(`${year}-${month}-01`).startOf('month');
    const monthEnd = monthStart.endOf('month');

    // 扩展复习计划计算范围：前后一个月
    // 这样可以包含日历界面显示的相邻月份的复习提醒
    const reviewRangeStart = monthStart.subtract(1, 'month').startOf('month');
    const reviewRangeEnd = monthEnd.add(1, 'month').endOf('month');

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

    // 获取当月学习的记录（按 studiedAt 过滤）
    const recordsInMonthModels = await this.prisma.studyRecord.findMany({
      where: {
        userId,
        studiedAt: {
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

    // 找出所有在扩展时间范围内有复习计划的学习记录
    const recordsWithReviewsInRange = new Set<string>();

    allStudyRecordsWithCourse.forEach((record) => {
      if (!record.course) return;

      reviewRules.forEach((rule) => {
        const reviewItems = this.calculateReviewsForRule(
          {
            id: record.id,
            textTitle: record.textTitle,
            studiedAt: record.studiedAt,
            course: record.course,
          },
          rule,
          reviewRangeStart,
          reviewRangeEnd,
        );

        // 如果这个记录在扩展范围内有复习计划，标记它
        if (reviewItems.length > 0) {
          recordsWithReviewsInRange.add(record.id);
        }
      });
    });

    // 合并当月学习记录和有复习计划的记录
    const allRelevantRecords = new Map<string, any>();

    // 添加当月学习记录
    recordsInMonthModels.forEach((record) => {
      allRelevantRecords.set(record.id, record);
    });

    // 添加有复习计划的记录
    allStudyRecordsWithCourse.forEach((record) => {
      if (recordsWithReviewsInRange.has(record.id)) {
        allRelevantRecords.set(record.id, record);
      }
    });

    // 初始化结果映射
    const recordsInMonthMap = new Map<string, StudyRecordWithReviewsDto>();
    Array.from(allRelevantRecords.values()).forEach((record) => {
      recordsInMonthMap.set(record.id, this.mapToDto(record));
    });

    // 计算复习计划 - 使用扩展的时间范围
    this.calculateReviewsForRecords(
      allStudyRecordsWithCourse,
      reviewRules,
      reviewRangeStart, // 前一个月开始
      reviewRangeEnd, // 后一个月结束
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
            `学习记录 ${record.id} (标题: ${record.textTitle}) 用户 ${record.userId} 缺少课程数据。跳过复习计算。`,
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
    const firstReviewTime = addInterval(baseTime, rule.value, rule.unit);

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

        const nextReviewTime = addInterval(
          currentReviewTime,
          rule.value,
          rule.unit,
        );

        // 防止无限循环
        if (nextReviewTime.isSame(currentReviewTime)) {
          this.logger.warn(
            `检测到记录 ${record.id} 和规则 ${rule.id} 在时间 ${currentReviewTime.toISOString()} 可能存在无限循环。中断执行。`,
          );
          break;
        }

        currentReviewTime = nextReviewTime;
        iterationCount++;
      }

      if (iterationCount >= maxIterations) {
        this.logger.warn(
          `记录 ${record.id} 和规则 ${rule.id} 达到最大迭代次数。已阻止可能的无限循环。`,
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
      ruleDescription: getRuleDescription(rule),
    };
  }
}
