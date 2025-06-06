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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { Course } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Course> {
    return this.coursesService.create(createCourseDto, req.user.id);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest): Promise<Course[]> {
    return this.coursesService.findAllByUserId(req.user.id);
  }

  @Patch(':courseId')
  async update(
    @Param('courseId') courseId: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Course> {
    return this.coursesService.update(courseId, updateCourseDto, req.user.id);
  }

  @Delete(':courseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('courseId') courseId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Course> {
    // Prisma delete returns the deleted object
    return this.coursesService.remove(courseId, req.user.id);
  }
}
