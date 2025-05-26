import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ManualReviewEntry, Prisma } from '../../generated/prisma';
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
      isCompleted: entry.isCompleted,
      completedAt: entry.completedAt?.toISOString(),
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

    // For manual entries, let's ensure the user owns the course or it's a default one they can add to.
    // Simpler: For now, only allow adding to their own non-default courses.
    if (course.userId !== userId && !course.isDefault) {
      // Adjusted to allow adding to default courses as well
      throw new ForbiddenException(
        '您只能为自己创建的课程或全局课程添加手动复习条目。',
      );
    }
    if (course.userId !== userId && course.isDefault) {
      // If it's a default course, the manual entry's userId is still the current user.
      this.logger.log(
        `User ${userId} creating manual entry for default course ${courseId}`,
      );
    }

    let reviewDateTime: Date;
    try {
      reviewDateTime = parseISO(reviewDate); // Expects YYYY-MM-DD, converts to UTC midnight
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
        // reviewTime is already a string and optional, stored directly
      },
      include: {
        course: { select: { name: true } },
      },
    });

    return this.toDto(newEntry);
  }

  async findAllByUser(
    userId: string,
    filters: { courseId?: string; isCompleted?: boolean },
  ): Promise<ManualReviewEntryDto[]> {
    const whereCondition: Prisma.ManualReviewEntryWhereInput = { userId };

    if (filters.courseId) {
      whereCondition.courseId = filters.courseId;
    }

    if (typeof filters.isCompleted === 'boolean') {
      whereCondition.isCompleted = filters.isCompleted;
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
      // Log this attempt, but don't throw Forbidden, just act as if not found for this user.
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
      if (course.userId !== userId && !course.isDefault) {
        throw new ForbiddenException(
          '您只能将条目关联到自己创建的课程或全局课程。',
        );
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

    // Handle isCompleted and completedAt explicitly if they are part of UpdateManualReviewEntryDto
    if (typeof updateDto.isCompleted === 'boolean') {
      dataToUpdate.isCompleted = updateDto.isCompleted;
      if (updateDto.isCompleted && updateDto.completedAt) {
        try {
          dataToUpdate.completedAt = parseISO(updateDto.completedAt);
        } catch (e) {
          this.logger.error(
            `Invalid completedAt format in update: ${updateDto.completedAt}`,
            (e as Error).stack,
          );
          throw new Error(
            '更新中无效的 completedAt 格式，期望 YYYY-MM-DDTHH:mm:ss.sssZ 或类似ISO格式',
          );
        }
      } else if (updateDto.isCompleted && !updateDto.completedAt) {
        dataToUpdate.completedAt = new Date(); // Default to now if not provided
      } else if (!updateDto.isCompleted) {
        dataToUpdate.completedAt = null; // Clear completedAt if marked as not completed
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

  async markAsCompleted(
    id: string,
    userId: string,
    completedAtDate?: Date,
  ): Promise<ManualReviewEntryDto> {
    const entry = await this.prisma.manualReviewEntry.findUnique({
      where: { id },
    });

    if (!entry || entry.userId !== userId) {
      throw new NotFoundException(
        `ID 为 ${id} 的手动复习条目未找到或您无权操作。`,
      );
    }

    const updatedEntry = await this.prisma.manualReviewEntry.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: completedAtDate || new Date(),
      },
      include: {
        course: { select: { name: true } },
      },
    });

    return this.toDto(updatedEntry);
  }

  async markAsNotCompleted(
    id: string,
    userId: string,
  ): Promise<ManualReviewEntryDto> {
    const entry = await this.prisma.manualReviewEntry.findUnique({
      where: { id },
    });

    if (!entry || entry.userId !== userId) {
      throw new NotFoundException(
        `ID 为 ${id} 的手动复习条目未找到或您无权操作。`,
      );
    }

    const updatedEntry = await this.prisma.manualReviewEntry.update({
      where: { id },
      data: {
        isCompleted: false,
        completedAt: null,
      },
      include: {
        course: { select: { name: true } },
      },
    });

    return this.toDto(updatedEntry);
  }
}
