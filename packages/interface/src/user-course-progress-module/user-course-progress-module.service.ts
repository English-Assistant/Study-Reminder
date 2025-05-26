import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserCourseCompletion } from '../../generated/prisma';
import { UserCourseCompletionDto } from './dto/user-course-completion.dto';

@Injectable()
export class UserCourseProgressModuleService {
  private readonly logger = new Logger(UserCourseProgressModuleService.name);

  constructor(private prisma: PrismaService) {}

  async markCourseAsCompleted(
    courseId: string,
    userId: string,
  ): Promise<UserCourseCompletion> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException(`ID 为 ${courseId} 的课程不存在`);
    }
    if (course.userId !== userId && !course.isDefault) {
      throw new ForbiddenException('您只能标记自己创建的课程为已完成。');
    }
    if (course.isDefault) {
      throw new ForbiddenException('不能标记全局模板课程为已完成状态。');
    }

    const existingCompletion =
      await this.prisma.userCourseCompletion.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

    if (existingCompletion) {
      throw new ConflictException('该课程已标记为完成');
    }

    return this.prisma.userCourseCompletion.create({
      data: {
        userId,
        courseId,
      },
    });
  }

  async getCompletedCourses(
    userId: string,
  ): Promise<UserCourseCompletionDto[]> {
    const completions = await this.prisma.userCourseCompletion.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    return completions
      .map((completion) => {
        if (!completion.course) {
          this.logger.error(
            `UserCourseCompletion record ${completion.id} is missing course data.`,
          );
          return null;
        }
        return {
          courseId: completion.courseId,
          courseName: completion.course.name,
          completedAt: completion.completedAt.toISOString(),
        };
      })
      .filter(Boolean) as UserCourseCompletionDto[];
  }

  async isCourseCompleted(courseId: string, userId: string): Promise<boolean> {
    const completion = await this.prisma.userCourseCompletion.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });
    return !!completion;
  }
}
