import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CoursesModuleService } from './courses-module.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth-module/guards/jwt-auth.guard';
import { Course } from '../../generated/prisma'; // 根据实际 Prisma Client 生成路径调整

// 定义请求中 user 对象的接口
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesModuleController {
  constructor(private readonly coursesService: CoursesModuleService) {}

  @Post()
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Course> {
    // req.user 在 JwtAuthGuard 中被赋值，包含 { userId: string, username: string }
    const userId = req.user.userId;
    return this.coursesService.create(createCourseDto, userId);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest): Promise<Course[]> {
    const userId = req.user.userId;
    return this.coursesService.findAll(userId);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Course | null> {
    const userId = req.user.userId;
    return this.coursesService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Course> {
    const userId = req.user.userId;
    return this.coursesService.update(id, updateCourseDto, userId);
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Course> {
    const userId = req.user.userId;
    return this.coursesService.remove(id, userId);
  }
}
