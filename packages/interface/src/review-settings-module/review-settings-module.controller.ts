import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ReviewSettingsService } from './review-settings-module.service';
import { SetGlobalReviewRulesDto } from './dto/set-global-review-rules.dto';
import { ReviewRuleDto } from './dto/review-rule.dto';
import { JwtAuthGuard } from '../auth-module/guards/jwt-auth.guard';

// 定义请求中 user 对象的接口 (与 CoursesModuleController 一致)
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('review-settings')
@UseGuards(JwtAuthGuard)
export class ReviewSettingsModuleController {
  constructor(private readonly reviewSettingsService: ReviewSettingsService) {}

  @Get()
  async getGlobalReviewRules(
    @Req() req: AuthenticatedRequest,
  ): Promise<ReviewRuleDto[]> {
    const userId = req.user.userId;
    return await this.reviewSettingsService.getGlobalReviewRules(userId);
  }

  @Post()
  async setGlobalReviewRules(
    @Body() setGlobalReviewRulesDto: SetGlobalReviewRulesDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ReviewRuleDto[]> {
    const userId = req.user.userId;
    return await this.reviewSettingsService.setGlobalReviewRules(
      userId,
      setGlobalReviewRulesDto,
    );
  }
}
