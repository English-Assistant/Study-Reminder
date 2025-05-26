import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LearningActivitiesModuleService } from './learning-activities-module.service';
import { CreateLearningActivityDto } from './dto/create-learning-activity.dto';
import { JwtAuthGuard } from '../auth-module/guards/jwt-auth.guard';
import { LearningActivity } from '../../generated/prisma';

// 与其他控制器一致的请求接口
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('learning-activities')
@UseGuards(JwtAuthGuard)
export class LearningActivitiesModuleController {
  constructor(
    private readonly learningActivitiesService: LearningActivitiesModuleService,
  ) {}

  @Post()
  async create(
    @Body() createLearningActivityDto: CreateLearningActivityDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<LearningActivity> {
    return await this.learningActivitiesService.create(
      createLearningActivityDto,
      req.user.userId,
    );
  }

  @Get('/course/:courseId')
  async findAllByCourse(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<LearningActivity[]> {
    return await this.learningActivitiesService.findAllByCourse(
      courseId,
      req.user.userId,
    );
  }

  @Get('/user')
  async findAllByUser(
    @Req() req: AuthenticatedRequest,
  ): Promise<LearningActivity[]> {
    return await this.learningActivitiesService.findAllByUser(req.user.userId);
  }

  @Get('/:id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<LearningActivity | null> {
    return await this.learningActivitiesService.findOne(id, req.user.userId);
  }
}
