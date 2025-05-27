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
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ManualReviewEntriesService } from '../services/manual-review-entries.service';
import { CreateManualReviewEntryDto } from '../dto/create-manual-review-entry.dto';
import { UpdateManualReviewEntryDto } from '../dto/update-manual-review-entry.dto';
import { JwtAuthGuard } from '../../auth-module/guards/jwt-auth.guard'; // 确保路径正确
import { ManualReviewEntry } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger'; // Swagger装饰器

@ApiTags('Manual Review Entries - 手动复习条目')
@ApiBearerAuth() // 表示此 Controller 下的所有路由都需要 JWT Bearer Token
@UseGuards(JwtAuthGuard)
@Controller('manual-review-entries')
export class ManualReviewEntriesController {
  constructor(
    private readonly manualReviewEntriesService: ManualReviewEntriesService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建新的手动复习条目' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: any, // Express Request object to get user from token
    @Body() createManualReviewEntryDto: CreateManualReviewEntryDto,
  ): Promise<ManualReviewEntry> {
    const userId = req.user.userId; // 从 JWT token payload 中获取 userId
    return this.manualReviewEntriesService.create(
      userId,
      createManualReviewEntryDto,
    );
  }

  @Get()
  @ApiOperation({ summary: '获取当前用户的所有手动复习条目 (可筛选)' })
  @ApiQuery({
    name: 'courseId',
    required: false,
    type: String,
    description: '按课程ID筛选 (UUID)',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: '起始日期 (ISO Date String, e.g., YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: '结束日期 (ISO Date String, e.g., YYYY-MM-DD)',
  })
  async findAll(
    @Req() req: any,
    @Query('courseId') courseId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<ManualReviewEntry[]> {
    const userId = req.user.userId;
    const filters: Record<string, any> = {};
    if (courseId !== undefined) filters.courseId = courseId;
    if (dateFrom !== undefined) filters.dateFrom = dateFrom;
    if (dateTo !== undefined) filters.dateTo = dateTo;

    return this.manualReviewEntriesService.findAllByUser(userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定ID的手动复习条目' })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: '复习条目ID (UUID)',
  })
  async findOne(
    @Req() req: any,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ManualReviewEntry> {
    const userId = req.user.userId;
    return this.manualReviewEntriesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新指定ID的手动复习条目' })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: '复习条目ID (UUID)',
  })
  async update(
    @Req() req: any,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateManualReviewEntryDto: UpdateManualReviewEntryDto,
  ): Promise<ManualReviewEntry> {
    const userId = req.user.userId;
    return this.manualReviewEntriesService.update(
      id,
      userId,
      updateManualReviewEntryDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除指定ID的手动复习条目' })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: '复习条目ID (UUID)',
  })
  @HttpCode(HttpStatus.NO_CONTENT) // 成功删除通常返回 204
  async remove(
    @Req() req: any,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    // 删除成功不返回内容
    const userId = req.user.userId;
    await this.manualReviewEntriesService.remove(id, userId);
  }
}
