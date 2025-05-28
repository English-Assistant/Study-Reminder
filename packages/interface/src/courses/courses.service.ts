import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createCourseDto: CreateCourseDto,
    userId: string,
  ): Promise<Course> {
    return this.prisma.course.create({
      data: {
        ...createCourseDto,
        userId,
      },
    });
  }

  async findAllByUserId(userId: string): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByCourseIdAndUserId(
    courseId: string,
    userId: string,
  ): Promise<Course | null> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException(`ID 为 ${courseId} 的课程未找到`);
    }
    if (course.userId !== userId) {
      throw new ForbiddenException('您无权访问此课程');
    }
    return course;
  }

  async update(
    courseId: string,
    updateCourseDto: UpdateCourseDto,
    userId: string,
  ): Promise<Course> {
    const course = await this.findOneByCourseIdAndUserId(courseId, userId); // 权限检查已包含
    if (!course) {
      // 理论上 findOneByCourseIdAndUserId 会抛出异常，但为保险起见
      throw new NotFoundException(`ID 为 ${courseId} 的课程未找到或您无权修改`);
    }
    return this.prisma.course.update({
      where: { id: courseId }, // 确保只更新属于该用户的课程
      data: updateCourseDto,
    });
  }

  async remove(courseId: string, userId: string): Promise<Course> {
    const course = await this.findOneByCourseIdAndUserId(courseId, userId); // 权限检查已包含
    if (!course) {
      throw new NotFoundException(`ID 为 ${courseId} 的课程未找到或您无权删除`);
    }
    // onDelete: Cascade 在 ManualReviewEntry 中处理了关联条目的删除
    return this.prisma.course.delete({
      where: { id: courseId },
    });
  }
}
