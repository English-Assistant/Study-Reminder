import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ManualReviewEntry, Prisma } from '@prisma/client';
import { CreateManualReviewEntryDto } from './dto/create-manual-review-entry.dto';
import { UpdateManualReviewEntryDto } from './dto/update-manual-review-entry.dto';
import { ManualReviewEntryDto } from './dto/manual-review-entry.dto';
import { parseISO, format } from 'date-fns';

@Injectable()
export class ManualReviewEntriesModuleService {
  private readonly logger = new Logger(ManualReviewEntriesModuleService.name);

  constructor(private prisma: PrismaService) {}

  // Helper to convert entity to DTO
  private toDto(
    entry: ManualReviewEntry & { course?: { name: string } },
  ): ManualReviewEntryDto {
    return {
      id: entry.id,
      courseId: entry.courseId,
      courseName: entry.course?.name,
      title: entry.title,
      description: entry.description ?? undefined,
      reviewDate: format(entry.reviewDate, 'yyyy-MM-dd'),
      reviewTime: entry.reviewTime ?? undefined,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };
  }

  async create(
    createDto: CreateManualReviewEntryDto,
    userId: string,
  ): Promise<ManualReviewEntryDto> {
    const { courseId, reviewDate, ...restData } = createDto;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`ID 为 ${courseId} 的课程不存在`);
    }

    if (course.userId !== userId) {
      throw new ForbiddenException('您只能为自己创建的课程添加手动复习条目。');
    }

    let reviewDateTime: Date;
    try {
      reviewDateTime = parseISO(reviewDate);
    } catch (e) {
      this.logger.error(
        `Invalid reviewDate format: ${reviewDate}`,
        (e as Error).stack,
      );
      throw new Error('无效的 reviewDate 格式，期望 YYYY-MM-DD');
    }

    const newEntry = await this.prisma.manualReviewEntry.create({
      data: {
        ...restData,
        userId,
        courseId,
        reviewDate: reviewDateTime,
      },
      include: {
        course: { select: { name: true } },
      },
    });

    return this.toDto(newEntry);
  }

  async findAllByUser(
    userId: string,
    filters: { courseId?: string /* isCompleted?: boolean */ },
  ): Promise<ManualReviewEntryDto[]> {
    const whereCondition: Prisma.ManualReviewEntryWhereInput = { userId };

    if (filters.courseId) {
      whereCondition.courseId = filters.courseId;
    }

    const entries = await this.prisma.manualReviewEntry.findMany({
      where: whereCondition,
      include: {
        course: { select: { name: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return entries.map(this.toDto.bind(this));
  }

  async findOne(
    id: string,
    userId: string,
  ): Promise<ManualReviewEntryDto | null> {
    const entry = await this.prisma.manualReviewEntry.findUnique({
      where: { id },
      include: {
        course: { select: { name: true } },
      },
    });

    if (!entry) {
      return null;
    }

    if (entry.userId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to access manual review entry ${id} owned by ${entry.userId}`,
      );
      return null;
    }

    return this.toDto(entry);
  }

  async update(
    id: string,
    updateDto: UpdateManualReviewEntryDto,
    userId: string,
  ): Promise<ManualReviewEntryDto> {
    const existingEntry = await this.prisma.manualReviewEntry.findUnique({
      where: { id },
    });

    if (!existingEntry || existingEntry.userId !== userId) {
      throw new NotFoundException(
        `ID 为 ${id} 的手动复习条目未找到或您无权修改。`,
      );
    }

    const {
      courseId: newCourseId,
      reviewDate: reviewDateStr,
      ...restUpdateData
    } = updateDto;
    const dataToUpdate: Prisma.ManualReviewEntryUpdateInput = {
      ...restUpdateData,
    };

    if (newCourseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: newCourseId },
      });
      if (!course) {
        throw new NotFoundException(`ID 为 ${newCourseId} 的新课程不存在`);
      }
      if (course.userId !== userId) {
        throw new ForbiddenException('您只能将条目关联到自己创建的课程。');
      }
      dataToUpdate.course = { connect: { id: newCourseId } };
    }

    if (reviewDateStr) {
      try {
        dataToUpdate.reviewDate = parseISO(reviewDateStr);
      } catch (e) {
        this.logger.error(
          `Invalid reviewDate format in update: ${reviewDateStr}`,
          (e as Error).stack,
        );
        throw new Error('更新中无效的 reviewDate 格式，期望 YYYY-MM-DD');
      }
    }

    const updatedEntry = await this.prisma.manualReviewEntry.update({
      where: { id },
      data: dataToUpdate,
      include: {
        course: { select: { name: true } },
      },
    });

    return this.toDto(updatedEntry);
  }

  async remove(id: string, userId: string): Promise<void> {
    const entry = await this.prisma.manualReviewEntry.findUnique({
      where: { id },
    });

    if (!entry || entry.userId !== userId) {
      throw new NotFoundException(
        `ID 为 ${id} 的手动复习条目未找到或您无权删除。`,
      );
    }

    await this.prisma.manualReviewEntry.delete({
      where: { id },
    });
  }
}
