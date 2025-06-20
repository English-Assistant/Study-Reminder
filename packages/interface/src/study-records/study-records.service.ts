import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudyRecord, Prisma } from '@prisma/client';
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
import { ReviewLogicService } from '../review-logic/review-logic.service';
import duration from 'dayjs/plugin/duration';
import { ensureFutureRecurringTime } from '../common/utils/recurring.util';
import {
  StudyRecordsByMonthResponseDto,
  CourseSummaryDto,
} from './dto/study-records-by-month-response.dto';
import { StudyRecordsByDaysResponseDto } from './dto/study-records-by-days-response.dto';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(duration);

@Injectable()
export class StudyRecordsService {
  private readonly logger = new Logger(StudyRecordsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewLogicService: ReviewLogicService,
  ) {}

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
  ): Promise<StudyRecordsByDaysResponseDto> {
    this.logger.log(
      `正在获取用户 ${userId} 的学习记录，课程ID：${courseId || '未传递'}，过滤日期：${filterDate || '未传递'}，添加天数范围：${addedWithinDays || '未传递'}`,
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
        select: {
          id: true,
          userId: true,
          courseId: true,
          studiedAt: true,
          textTitle: true,
          note: true,
          createdAt: true,
        },
      });

      const groupedByDate = groupBy(records, (record) =>
        dayjs(record.studiedAt).format('YYYY-MM-DD'),
      );

      const result = map(groupedByDate, (dayRecords, date) => ({
        date,
        records: orderBy(dayRecords, ['studiedAt'], ['desc']),
      }));

      const sortedRecords = orderBy(result, ['date'], ['desc']);

      // fetch courses list
      const courses: CourseSummaryDto[] = await this.prisma.course.findMany({
        where: { userId },
        select: { id: true, name: true, color: true, note: true },
      });

      return { courses, groups: sortedRecords };
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
      await this.prisma.studyRecord.delete({ where: { id } });
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
    this.logger.log(`正在计算用户 ${userId} 的连续学习天数`);
    const records = await this.prisma.studyRecord.findMany({
      where: { userId },
      orderBy: { studiedAt: 'desc' },
      select: { studiedAt: true },
    });

    if (records.length === 0) {
      return 0;
    }

    const uniqueDays = [
      ...new Set(
        records.map((r) => dayjs(r.studiedAt).startOf('day').toISOString()),
      ),
    ].map((dateStr) => dayjs(dateStr));

    if (uniqueDays.length <= 1) {
      return uniqueDays.length;
    }

    uniqueDays.sort((a, b) => b.diff(a));

    let consecutiveDays = 1;
    const today = dayjs().startOf('day');
    const lastStudyDay = uniqueDays[0];

    if (
      !lastStudyDay.isSame(today) &&
      !lastStudyDay.isSame(today.subtract(1, 'day'))
    ) {
      return 0;
    }

    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const currentDay = uniqueDays[i];
      const nextDay = uniqueDays[i + 1];
      if (currentDay.subtract(1, 'day').isSame(nextDay)) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  }

  async getStudyRecordsAndReviewsByMonth(
    userId: string,
    year: number,
    month: number, // 1-indexed
  ): Promise<StudyRecordsByMonthResponseDto> {
    this.logger.log(
      `正在获取用户 ${userId} 在 ${year}年${month}月的学习记录和复习计划`,
    );

    const monthStart = dayjs(`${year}-${month}-01`).startOf('month');
    const monthEnd = monthStart.endOf('month');

    // 计算以周一为起点、周日为终点的日历区间（共 6×7 = 42 格）
    const startOffset = (monthStart.day() + 6) % 7; // 把周一映射为 0，周日映射为 6
    const calendarStart = monthStart.subtract(startOffset, 'day');

    const endDowIndex = (monthEnd.day() + 6) % 7; // 同样的映射
    const endOffset = 6 - endDowIndex;
    const calendarEnd = monthEnd.add(endOffset, 'day').endOf('day');

    const studyRecordSelectScope = {
      id: true,
      userId: true,
      courseId: true,
      textTitle: true,
      note: true,
      studiedAt: true,
      createdAt: true,
    };

    const userWithData = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studyRecords: {
          select: studyRecordSelectScope,
          orderBy: { studiedAt: 'desc' },
        },
        reviewRules: true,
      },
    });

    if (!userWithData) {
      this.logger.warn(`未找到用户 ${userId} 的数据。`);
      return {
        courses: [],
        records: [],
      };
    }

    const { studyRecords, reviewRules } = userWithData;

    // 先收集「本月」学习记录用于优先展示（studiedAt 在月内），
    // 其它月份但存在复习计划的记录稍后会自动加入 map
    const recordsInMonth = studyRecords.filter((record) =>
      dayjs(record.studiedAt).isBetween(monthStart, monthEnd, null, '[]'),
    );

    // 提前获取课程列表供返回
    const courses: CourseSummaryDto[] = await this.prisma.course.findMany({
      where: { userId },
      select: { id: true, name: true, color: true, note: true },
    });

    if (isEmpty(reviewRules)) {
      return {
        courses,
        records: recordsInMonth.map(this.mapToDto),
      };
    }

    const recordsInMonthMap = new Map<string, StudyRecordWithReviewsDto>(
      recordsInMonth.map((r) => [r.id, this.mapToDto(r)]),
    );

    for (const record of studyRecords) {
      for (const rule of reviewRules) {
        let expectedReviewAtDayjs =
          this.reviewLogicService.calculateNextReviewTime(
            record.studiedAt,
            rule,
          );

        // 确保滚动到日历窗口的起始位置（例如 5 月 26 ~）
        expectedReviewAtDayjs = ensureFutureRecurringTime(
          expectedReviewAtDayjs,
          rule,
          calendarStart,
        );

        while (expectedReviewAtDayjs.isBefore(calendarEnd)) {
          const adjustedTime =
            this.reviewLogicService.adjustReviewTimeForStudyWindows(
              expectedReviewAtDayjs,
            );

          if (adjustedTime.isBetween(calendarStart, calendarEnd, null, '[]')) {
            const reviewItem: UpcomingReviewInRecordDto = {
              studyRecordId: record.id,
              courseId: record.courseId,
              textTitle: record.textTitle,
              expectedReviewAt: adjustedTime.toDate(),
              ruleId: rule.id,
              ruleDescription: getRuleDescription(rule),
            };

            let dto = recordsInMonthMap.get(record.id);
            if (!dto) {
              dto = this.mapToDto(record);
              recordsInMonthMap.set(record.id, dto);
            }
            dto.upcomingReviewsInMonth.push(reviewItem);
          }

          if (rule.mode !== 'RECURRING') break;

          const ruleInterval = dayjs.duration(
            rule.value,
            rule.unit.toLowerCase() as dayjs.ManipulateType,
          );
          if (ruleInterval.asMilliseconds() <= 0) break;
          expectedReviewAtDayjs = expectedReviewAtDayjs.add(
            ruleInterval.asMilliseconds(),
            'millisecond',
          );
        }
      }
    }

    const recordsArray = Array.from(recordsInMonthMap.values()).map(
      (record) => ({
        ...record,
        upcomingReviewsInMonth: sortBy(
          record.upcomingReviewsInMonth,
          (review) => dayjs(review.expectedReviewAt).valueOf(),
        ),
      }),
    );

    const sortedRecords = sortBy(recordsArray, (record) =>
      dayjs(record.studiedAt).valueOf(),
    );

    return {
      courses,
      records: sortedRecords,
    };
  }

  private mapToDto = (record: {
    id: string;
    userId: string;
    courseId: string;
    textTitle: string;
    note: string | null;
    studiedAt: Date;
    createdAt: Date;
  }): StudyRecordWithReviewsDto => ({
    id: record.id,
    userId: record.userId,
    courseId: record.courseId,
    textTitle: record.textTitle,
    note: record.note,
    studiedAt: record.studiedAt,
    createdAt: record.createdAt,
    upcomingReviewsInMonth: [],
  });
}
