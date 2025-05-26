import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLearningActivityDto } from './dto/create-learning-activity.dto';
import { LearningActivity } from '../../generated/prisma';

@Injectable()
export class LearningActivitiesModuleService {
  constructor(private prisma: PrismaService) {}

  async create(
    createDto: CreateLearningActivityDto,
    userId: string,
  ): Promise<LearningActivity> {
    // 检查课程是否存在且属于该用户
    const course = await this.prisma.course.findUnique({
      where: { id: createDto.courseId },
    });

    if (!course) {
      throw new NotFoundException(`ID 为 ${createDto.courseId} 的课程不存在`);
    }

    if (course.userId !== userId) {
      throw new ForbiddenException('您无权在此课程下记录活动');
    }

    return this.prisma.learningActivity.create({
      data: {
        ...createDto,
        userId,
        // activityTimestamp 默认由 Prisma schema 处理 (default(now()))
      },
    });
  }

  async findAllByCourse(
    courseId: string,
    userId: string,
  ): Promise<LearningActivity[]> {
    // 验证用户是否有权访问该课程的学习活动
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, userId: userId },
    });

    if (!course) {
      throw new NotFoundException(`课程 ID ${courseId} 不存在或您无权访问。`);
    }

    return this.prisma.learningActivity.findMany({
      where: {
        courseId,
        userId, // 确保只返回该用户的活动，即使课程是共享的（未来可能）
      },
      orderBy: {
        activityTimestamp: 'desc',
      },
    });
  }

  async findAllByUser(userId: string): Promise<LearningActivity[]> {
    return this.prisma.learningActivity.findMany({
      where: { userId },
      orderBy: {
        activityTimestamp: 'desc',
      },
      include: {
        // 可以考虑是否需要包含课程信息
        course: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string): Promise<LearningActivity | null> {
    const activity = await this.prisma.learningActivity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundException(`ID 为 ${id} 的学习活动不存在`);
    }

    if (activity.userId !== userId) {
      // 虽然通常是通过 courseId 过滤，但直接访问活动时也应检查 userId
      throw new ForbiddenException('您无权访问此学习活动');
    }
    return activity;
  }

  // 学习活动通常不更新，如果需要更新，则添加 update 方法
  // 学习活动通常不单独删除，除非是错误记录。如果需要，添加 remove 方法。
  // 删除通常通过级联删除（例如删除课程时）处理。
}
