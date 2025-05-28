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
import { StudyRecordsService } from './study-records.service';
import { CreateStudyRecordDto } from './dto/create-study-record.dto';
import { UpdateStudyRecordDto } from './dto/update-study-record.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/interfaces/authenticated-request.interface';
import { GetStudyRecordsDto } from './dto/get-study-records.dto';
import { StudyRecordDto } from './dto/study-record.dto';

@UseGuards(JwtAuthGuard)
@Controller('study-records')
export class StudyRecordsController {
  constructor(private readonly studyRecordsService: StudyRecordsService) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createStudyRecordDto: CreateStudyRecordDto,
  ): Promise<StudyRecordDto> {
    return this.studyRecordsService.create(req.user.id, createStudyRecordDto);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetStudyRecordsDto,
  ): Promise<StudyRecordDto[]> {
    const userId = req.user.id;
    return this.studyRecordsService.findAllByUserId(
      userId,
      query.courseId,
      query.filterDate,
      query.addedWithinDays,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<StudyRecordDto | null> {
    return this.studyRecordsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateStudyRecordDto: UpdateStudyRecordDto,
  ): Promise<StudyRecordDto | null> {
    return this.studyRecordsService.update(
      id,
      req.user.id,
      updateStudyRecordDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.studyRecordsService.remove(id, req.user.id);
  }

  @Get('consecutive-days')
  async getConsecutiveDays(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ days: number }> {
    const days = await this.studyRecordsService.getConsecutiveStudyDays(
      req.user.id,
    );
    return { days };
  }
}
