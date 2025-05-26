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
  NotFoundException,
} from '@nestjs/common';
import { ManualReviewEntriesModuleService } from './manual-review-entries-module.service';
import { CreateManualReviewEntryDto } from './dto/create-manual-review-entry.dto';
import { UpdateManualReviewEntryDto } from './dto/update-manual-review-entry.dto';
import { ManualReviewEntryDto } from './dto/manual-review-entry.dto';
import { JwtAuthGuard } from '../auth-module/guards/jwt-auth.guard';
import { OptionalParseBoolPipe } from './optional-parse-bool.pipe';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('manual-review-entries')
@UseGuards(JwtAuthGuard)
export class ManualReviewEntriesModuleController {
  constructor(
    private readonly entriesService: ManualReviewEntriesModuleService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateManualReviewEntryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ManualReviewEntryDto> {
    return await this.entriesService.create(createDto, req.user.userId);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('courseId') courseId?: string,
    @Query('isCompleted', new OptionalParseBoolPipe()) isCompleted?: boolean,
  ): Promise<ManualReviewEntryDto[]> {
    const filters: { courseId?: string; isCompleted?: boolean } = {};
    if (courseId) filters.courseId = courseId;
    if (isCompleted !== undefined) filters.isCompleted = isCompleted;
    return await this.entriesService.findAllByUser(req.user.userId, filters);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ManualReviewEntryDto> {
    const entry = await this.entriesService.findOne(id, req.user.userId);
    if (!entry) {
      throw new NotFoundException(`ID 为 ${id} 的手动复习条目未找到。`);
    }
    return entry;
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateDto: UpdateManualReviewEntryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ManualReviewEntryDto> {
    return await this.entriesService.update(id, updateDto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.entriesService.remove(id, req.user.userId);
  }

  @Post(':id/complete')
  async markAsCompleted(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ManualReviewEntryDto> {
    return await this.entriesService.markAsCompleted(id, req.user.userId);
  }

  @Post(':id/uncomplete')
  async markAsNotCompleted(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ManualReviewEntryDto> {
    return await this.entriesService.markAsNotCompleted(id, req.user.userId);
  }
}
