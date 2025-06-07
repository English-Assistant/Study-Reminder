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
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StudyRecordsService } from './study-records.service';
import { CreateStudyRecordDto } from './dto/create-study-record.dto';
import { UpdateStudyRecordDto } from './dto/update-study-record.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/interfaces/authenticated-request.interface';
import { GetStudyRecordsDto } from './dto/get-study-records.dto';
import { GetStudyRecordsByMonthQueryDto } from './dto/get-study-records-by-month-query.dto';
import { StudyRecordWithReviewsDto } from './dto/study-record-with-reviews.dto';
import { GroupedStudyRecordsDto } from './dto/grouped-study-records.dto';

@UseGuards(JwtAuthGuard)
@Controller('study-records')
export class StudyRecordsController {
  constructor(private readonly studyRecordsService: StudyRecordsService) {}

  /**
   * 创建新的学习记录。
   * @param req 包含认证用户信息的请求对象。
   * @param createStudyRecordDto 创建学习记录所需的数据传输对象。
   * @returns 创建成功后的学习记录。
   */
  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createStudyRecordDto: CreateStudyRecordDto,
  ) {
    const userId = req.user.id;
    return this.studyRecordsService.create(userId, createStudyRecordDto);
  }

  /**
   * 获取所有学习记录。
   * @param req 包含认证用户信息的请求对象。
   * @param query 包含课程ID、过滤日期和添加时间范围的查询参数对象。
   * @returns 一个包含学习记录的数组。
   */
  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetStudyRecordsDto,
  ): Promise<GroupedStudyRecordsDto[]> {
    const userId = req.user.id;
    return this.studyRecordsService.findAllByUserId(
      userId,
      query.courseId,
      query.filterDate,
      query.addedWithinDays,
    );
  }

  /**
   * 获取连续学习天数。
   * @param req 包含认证用户信息的请求对象。
   * @returns 一个包含连续学习天数的对象。
   */
  @Get('consecutive-days')
  async getConsecutiveDays(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ days: number }> {
    const days = await this.studyRecordsService.getConsecutiveStudyDays(
      req.user.id,
    );
    return { days };
  }

  /**
   * 根据月份获取当前用户的学习记录及当月待复习项。
   * @param req 包含认证用户信息的请求对象。
   * @param query 包含年份和月份的查询参数对象。
   * @returns 一个包含学习记录及它们在当月待复习项的数组。
   */
  @Get('by-month')
  async getByMonth(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetStudyRecordsByMonthQueryDto,
  ): Promise<StudyRecordWithReviewsDto[]> {
    const userId = req.user.id;
    return this.studyRecordsService.getStudyRecordsAndReviewsByMonth(
      userId,
      query.year,
      query.month,
    );
  }

  /**
   * 更新指定的学习记录。
   * 需要用户认证，且只能更新用户自己的学习记录。
   * @param id 学习记录的ID。
   * @param req 包含认证用户信息的请求对象。
   * @param updateStudyRecordDto 更新学习记录所需的数据传输对象。
   * @returns 更新后的学习记录对象，如果未找到则返回 null 或抛出 NotFoundException。
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateStudyRecordDto: UpdateStudyRecordDto,
  ) {
    return this.studyRecordsService.update(
      id,
      req.user.id,
      updateStudyRecordDto,
    );
  }

  /**
   * 根据ID删除指定的学习记录。
   * 需要用户认证，且只能删除用户自己的学习记录。
   * @param id 学习记录的ID。
   * @param req 包含认证用户信息的请求对象。
   * @returns Promise<void>，表示操作完成。
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.studyRecordsService.remove(id, req.user.id);
  }

  /**
   * 获取指定用户的学习记录总数。
   * @param req 包含认证用户信息的请求对象。
   * @returns 一个包含总数的对象。
   */
  @Get('count')
  countAll(@Req() req: AuthenticatedRequest): Promise<{ count: number }> {
    const userId = req.user.id;
    return this.studyRecordsService.countAllByUserId(userId);
  }
}
