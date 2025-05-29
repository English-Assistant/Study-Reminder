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
import * as utc from 'dayjs/plugin/utc';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import {
  StudyRecordWithReviewsDto,
  UpcomingReviewInRecordDto,
} from './dto/study-record-with-reviews.dto';

dayjs.extend(utc);
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

      const studiedAtDate = dayjs.utc(createStudyRecordDto.studiedAt);
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
      const day = dayjs.utc(filterDate, 'YYYY-MM-DD');
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
      const sinceDate = dayjs
        .utc()
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
      const studiedAtDate = dayjs.utc(updateStudyRecordDto.studiedAt);
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
    const records = await this.prisma.studyRecord.findMany({
      where: {
        userId,
        studiedAt: {
          lte: today.toDate(), // Records up to and including today
        },
      },
      orderBy: {
        studiedAt: 'desc',
      },
      select: {
        studiedAt: true,
      },
      // take: 365, // Consider a limit for very long streaks
    });

    if (records.length === 0) {
      return 0;
    }

    const studyDates = new Set<string>();
    records.forEach((record) => {
      studyDates.add(dayjs(record.studiedAt).format('YYYY-MM-DD'));
    });

    let consecutiveDays = 0;
    let currentDate = today.clone();

    if (studyDates.has(currentDate.format('YYYY-MM-DD'))) {
      consecutiveDays = 1;
      currentDate = currentDate.subtract(1, 'day');
    } else {
      return 0; // Not studied today, so 0 consecutive days
    }

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
    const baseTime = dayjs(studiedAt).utc().second(0).millisecond(0);
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

    const monthStart = dayjs.utc(`${year}-${month}-01`).startOf('month');
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

    const reviewRules = await this.prisma.reviewRule.findMany({
      where: { userId },
    });

    const mapToDto = (record: {
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

    if (!reviewRules.length) {
      return recordsInMonthModels.map(mapToDto);
    }

    const allStudyRecordsWithCourse = await this.prisma.studyRecord.findMany({
      where: { userId },
      select: studyRecordSelectScope,
    });

    const recordsInMonthMap = new Map<string, StudyRecordWithReviewsDto>();
    for (const record of recordsInMonthModels) {
      recordsInMonthMap.set(record.id, mapToDto(record));
    }

    for (const record of allStudyRecordsWithCourse) {
      if (!record.course) {
        this.logger.warn(
          `Study record ${record.id} (title: ${record.textTitle}) for user ${userId} is missing course data. Skipping for review calculation.`,
        );
        continue;
      }

      for (const rule of reviewRules) {
        const baseTime = dayjs(record.studiedAt).utc().second(0).millisecond(0);
        const nextReviewTime = this.addInterval(
          baseTime,
          rule.value,
          rule.unit,
        );

        if (rule.mode === ReviewMode.ONCE) {
          if (
            nextReviewTime.isSameOrAfter(monthStart) &&
            nextReviewTime.isSameOrBefore(monthEnd)
          ) {
            const reviewItem: UpcomingReviewInRecordDto = {
              studyRecordId: record.id,
              textTitle: record.textTitle,
              courseId: record.courseId,
              courseName: record.course.name,
              expectedReviewAt: nextReviewTime.toDate(),
              ruleId: rule.id,
              ruleDescription: this.getRuleDescription(rule),
            };
            if (recordsInMonthMap.has(record.id)) {
              recordsInMonthMap
                .get(record.id)
                ?.upcomingReviewsInMonth.push(reviewItem);
            }
          }
        } else if (rule.mode === ReviewMode.RECURRING) {
          let tempNextReviewTime = nextReviewTime;
          while (tempNextReviewTime.isSameOrBefore(monthEnd)) {
            if (tempNextReviewTime.isSameOrAfter(monthStart)) {
              if (tempNextReviewTime.isSameOrAfter(baseTime)) {
                const reviewItem: UpcomingReviewInRecordDto = {
                  studyRecordId: record.id,
                  textTitle: record.textTitle,
                  courseId: record.courseId,
                  courseName: record.course.name,
                  expectedReviewAt: tempNextReviewTime.toDate(),
                  ruleId: rule.id,
                  ruleDescription: this.getRuleDescription(rule),
                };
                if (recordsInMonthMap.has(record.id)) {
                  recordsInMonthMap
                    .get(record.id)
                    ?.upcomingReviewsInMonth.push(reviewItem);
                }
              }
            }
            const calculatedNext = this.addInterval(
              tempNextReviewTime,
              rule.value,
              rule.unit,
            );
            if (calculatedNext.isSame(tempNextReviewTime)) {
              this.logger.warn(
                `Potential infinite loop or no progression detected for record ${record.id} and rule ${rule.id} at time ${tempNextReviewTime.toISOString()}. Breaking.`,
              );
              break;
            }
            tempNextReviewTime = calculatedNext;
          }
        }
      }
    }

    const finalResults = Array.from(recordsInMonthMap.values()).map(
      (record) => {
        record.upcomingReviewsInMonth.sort(
          (a, b) =>
            dayjs(a.expectedReviewAt).valueOf() -
            dayjs(b.expectedReviewAt).valueOf(),
        );
        return record;
      },
    );

    finalResults.sort(
      (a, b) => dayjs(a.studiedAt).valueOf() - dayjs(b.studiedAt).valueOf(),
    );

    return finalResults;
  }
}
