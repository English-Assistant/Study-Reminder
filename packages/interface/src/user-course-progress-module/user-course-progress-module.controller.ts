import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserCourseProgressModuleService } from './user-course-progress-module.service';
import { UserCourseCompletionDto } from './dto/user-course-completion.dto';
import { JwtAuthGuard } from '../auth-module/guards/jwt-auth.guard';
import { UserCourseCompletion } from '../../generated/prisma';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('user-course-progress')
@UseGuards(JwtAuthGuard)
export class UserCourseProgressModuleController {
  constructor(
    private readonly progressService: UserCourseProgressModuleService,
  ) {}

  @Post('course/:courseId/complete')
  @HttpCode(HttpStatus.CREATED)
  async markCourseAsCompleted(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserCourseCompletion> {
    return await this.progressService.markCourseAsCompleted(
      courseId,
      req.user.userId,
    );
  }

  @Get('completed')
  async getCompletedCourses(
    @Req() req: AuthenticatedRequest,
  ): Promise<UserCourseCompletionDto[]> {
    return await this.progressService.getCompletedCourses(req.user.userId);
  }

  @Get('course/:courseId/status')
  async getCourseCompletionStatus(
    @Param('courseId', new ParseUUIDPipe()) courseId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ completed: boolean }> {
    const completed = await this.progressService.isCourseCompleted(
      courseId,
      req.user.userId,
    );
    return { completed };
  }
}
