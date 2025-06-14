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

/**
 * 课程服务
 * ------------------------------------------------------------
 * 提供课程的 CRUD 能力，并做权限/唯一性校验。
 */
@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建课程（同名校验）
   * @param createCourseDto 前端提交的课程数据
   * @param userId 当前用户 ID
   */
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

  /** 获取用户全部课程（按创建时间倒序） */
  async findAllByUserId(userId: string): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 根据课程 ID + 用户 ID 获取课程，并同时做权限校验
   */
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

  /**
   * 更新课程
   * 1. 先做权限校验
   * 2. 若修改名称需检查同名冲突
   */
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

  /** 删除课程（含权限校验） */
  async remove(courseId: string, userId: string): Promise<Course> {
    const course = await this.findOneByCourseIdAndUserId(courseId, userId); // 权限检查已包含
    if (!course) {
      throw new NotFoundException(`ID 为 ${courseId} 的课程未找到或您无权删除`);
    }
    return this.prisma.course.delete({
      where: { id: courseId },
    });
  }
}
