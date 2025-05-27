import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateManualReviewEntryDto } from '../dto/create-manual-review-entry.dto';
import { UpdateManualReviewEntryDto } from '../dto/update-manual-review-entry.dto';
import { ManualReviewEntry, Prisma } from '@prisma/client';

export interface ManualReviewEntryFilters {
  courseId?: string;
  dateFrom?: string; // ISO Date string
  dateTo?: string; // ISO Date string
  // isCompleted?: boolean; // Removed isCompleted from filters
  // 可以添加更多筛选，例如按标题搜索等
}

@Injectable()
export class ManualReviewEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    createDto: CreateManualReviewEntryDto,
  ): Promise<ManualReviewEntry> {
    // 检查课程是否存在并且属于该用户 (可选，但推荐，取决于您的课程所有权逻辑)
    // const course = await this.prisma.course.findFirst({
    //   where: { id: createDto.courseId, userId: userId },
    // });
    // if (!course) {
    //   throw new NotFoundException(
    //     `ID 为 ${createDto.courseId} 的课程不存在或不属于当前用户。`,
    //   );
    // }

    return await this.prisma.manualReviewEntry.create({
      data: {
        ...createDto,
        reviewDate: new Date(createDto.reviewDate), // 将 ISO 字符串转换为 Date 对象
        userId: userId,
      },
    });
  }

  async findAllByUser(
    userId: string,
    filters?: ManualReviewEntryFilters,
  ): Promise<ManualReviewEntry[]> {
    const where: Prisma.ManualReviewEntryWhereInput = {
      userId: userId,
    };

    if (filters?.courseId) {
      where.courseId = filters.courseId;
    }
    // Removed isCompleted filter logic
    // if (filters?.isCompleted !== undefined) {
    //   where.isCompleted = filters.isCompleted;
    // }

    // 安全地构建 reviewDate 过滤器
    if (filters?.dateFrom) {
      if (!where.reviewDate || typeof where.reviewDate !== 'object') {
        where.reviewDate = {};
      }
      (where.reviewDate as Prisma.DateTimeFilter).gte = new Date(
        filters.dateFrom,
      );
    }
    if (filters?.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      if (!where.reviewDate || typeof where.reviewDate !== 'object') {
        where.reviewDate = {};
      }
      (where.reviewDate as Prisma.DateTimeFilter).lte = endDate;
    }

    return await this.prisma.manualReviewEntry.findMany({
      where,
      orderBy: {
        reviewDate: 'asc', // 默认按复习日期升序
      },
      // 可以考虑分页 (take, skip)
    });
  }

  async findOne(id: string, userId: string): Promise<ManualReviewEntry> {
    const entry = await this.prisma.manualReviewEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException(`ID 为 ${id} 的复习条目未找到。`);
    }
    if (entry.userId !== userId) {
      throw new ForbiddenException('您无权访问此复习条目。');
    }
    return entry;
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateManualReviewEntryDto,
  ): Promise<ManualReviewEntry> {
    await this.findOne(id, userId); // Ensure existence and ownership

    const dataToUpdate: Prisma.ManualReviewEntryUpdateInput = {
      ...updateDto,
    };

    if (updateDto.reviewDate) {
      dataToUpdate.reviewDate = new Date(updateDto.reviewDate);
    }

    // Removed logic related to isCompleted and completedAt
    // if (updateDto.isCompleted === true && !entry.isCompleted) {
    //   dataToUpdate.completedAt = new Date();
    // }
    // if (updateDto.isCompleted === false && entry.isCompleted) {
    //   dataToUpdate.completedAt = null;
    // }

    return await this.prisma.manualReviewEntry.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string, userId: string): Promise<ManualReviewEntry> {
    await this.findOne(id, userId); // 确保存在且用户有权访问
    return await this.prisma.manualReviewEntry.delete({
      where: { id },
    });
  }
}
