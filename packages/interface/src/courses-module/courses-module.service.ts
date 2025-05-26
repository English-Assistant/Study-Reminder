import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from '../../generated/prisma'; // User 移除

@Injectable()
export class CoursesModuleService {
  constructor(private prisma: PrismaService) {}

  async create(
    createCourseDto: CreateCourseDto,
    userId: string,
  ): Promise<Course> {
    const { title, ...restOfDto } = createCourseDto;
    // 不允许用户创建 isDefault 为 true 的课程，这个由 ReviewSettingsService 内部管理
    return await this.prisma.course.create({
      data: {
        name: title,
        ...restOfDto,
        userId,
        isDefault: false, // 确保用户创建的课程不是默认模板
      },
    });
  }

  async findAll(userId: string): Promise<Course[]> {
    return await this.prisma.course.findMany({
      where: {
        userId,
        isDefault: false, // 通常不返回作为全局模板的课程
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string): Promise<Course | null> {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException(`ID 为 ${id} 的课程不存在`);
    }

    if (course.userId !== userId) {
      throw new ForbiddenException('您无权访问此课程');
    }

    // 不应允许用户直接获取 isDefault 为 true 的课程，除非有特殊逻辑需要
    if (course.isDefault) {
      throw new ForbiddenException('无法直接访问默认模板课程');
    }

    return course;
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    userId: string,
  ): Promise<Course> {
    const course = await this.findOne(id, userId); // findOne 包含权限和存在性检查
    if (!course) {
      // 冗余检查，但保持明确
      throw new NotFoundException(`ID 为 ${id} 的课程不存在或您无权访问`);
    }

    const { title, ...restOfDto } = updateCourseDto;
    const dataToUpdate: Partial<
      Omit<
        Course,
        'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isDefault' | 'user'
      >
    > = {
      ...restOfDto, // This will include description and color if they are present
    };

    if (title !== undefined) {
      dataToUpdate.name = title; // Map title from DTO to name for Prisma
    }

    return await this.prisma.course.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string, userId: string): Promise<Course> {
    const course = await this.findOne(id, userId); // findOne 包含权限和存在性检查
    if (!course) {
      // 冗余检查
      throw new NotFoundException(`ID 为 ${id} 的课程不存在或您无权访问`);
    }

    // TODO: 考虑删除课程时的级联操作，例如相关的学习活动、复习规则等是否也应删除或处理。
    // 目前 Prisma Schema 中定义了 onDelete: Cascade，所以相关联的记录会被自动删除。
    return await this.prisma.course.delete({
      where: { id },
    });
  }
}
