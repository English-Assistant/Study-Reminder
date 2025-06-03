import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
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
    // 检查同一用户下是否已存在相同名称的课程
    const existingCourse = await this.prisma.course.findFirst({
      where: {
        userId,
        name: createCourseDto.name,
      },
    });

    if (existingCourse) {
      throw new ConflictException(
        `课程名称 "${createCourseDto.name}" 已存在，请使用其他名称`,
      );
    }

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

    // 如果要更新名称，检查同一用户下是否已存在相同名称的其他课程
    if (updateCourseDto.name && updateCourseDto.name !== course.name) {
      const existingCourse = await this.prisma.course.findFirst({
        where: {
          userId,
          name: updateCourseDto.name,
          id: { not: courseId }, // 排除当前课程
        },
      });

      if (existingCourse) {
        throw new ConflictException(
          `课程名称 "${updateCourseDto.name}" 已存在，请使用其他名称`,
        );
      }
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
