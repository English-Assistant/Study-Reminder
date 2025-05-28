import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudyRecord, Prisma } from '@prisma/client';
import { CreateStudyRecordDto } from './dto/create-study-record.dto';
import { UpdateStudyRecordDto } from './dto/update-study-record.dto';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

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
}
