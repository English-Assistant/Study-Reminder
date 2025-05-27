import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { ScheduledReviewsModuleService } from './scheduled-reviews-module.service';
import { ScheduledReviewDto } from './dto/scheduled-review.dto';
import { JwtAuthGuard } from '../auth-module/guards/jwt-auth.guard';
import { IsOptional, IsISO8601 } from 'class-validator';
import { Request } from 'express';

class GetScheduledReviewsQueryDto {
  @IsOptional()
  @IsISO8601(
    { strict: true, strictSeparator: true },
    {
      message:
        '起始日期格式必须是有效的 ISO 8601 日期字符串 (例如 YYYY-MM-DDTHH:mm:ss.sssZ 或 YYYY-MM-DD)',
    },
  )
  from?: string;

  @IsOptional()
  @IsISO8601(
    { strict: true, strictSeparator: true },
    {
      message:
        '结束日期格式必须是有效的 ISO 8601 日期字符串 (例如 YYYY-MM-DDTHH:mm:ss.sssZ 或 YYYY-MM-DD)',
    },
  )
  to?: string;
}

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('scheduled-reviews')
@UseGuards(JwtAuthGuard)
export class ScheduledReviewsModuleController {
  constructor(
    private readonly scheduledReviewsService: ScheduledReviewsModuleService,
  ) {}

  @Get()
  async getScheduledReviews(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetScheduledReviewsQueryDto,
  ): Promise<ScheduledReviewDto[]> {
    return await this.scheduledReviewsService.getScheduledReviews(
      req.user.userId,
      query.from,
      query.to,
    );
  }
}
