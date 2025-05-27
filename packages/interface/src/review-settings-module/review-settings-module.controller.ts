import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ReviewSettingsService } from './review-settings-module.service';
import { SetGlobalReviewRulesDto } from './dto/set-global-review-rules.dto';
import { GlobalReviewSettingsDto } from './dto/global-review-settings.dto';
import { JwtAuthGuard } from '../auth-module/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

// 定义请求中 user 对象的接口 (与 CoursesModuleController 一致)
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@ApiBearerAuth()
@ApiTags('Review Settings')
@Controller('review-settings')
@UseGuards(JwtAuthGuard)
export class ReviewSettingsModuleController {
  constructor(private readonly reviewSettingsService: ReviewSettingsService) {}

  @Get()
  @ApiOperation({ summary: '获取用户全局复习设置' })
  @ApiResponse({
    status: 200,
    description: '成功获取全局复习设置',
    type: GlobalReviewSettingsDto,
  })
  async getGlobalSettings(
    @Req() req: AuthenticatedRequest,
  ): Promise<GlobalReviewSettingsDto> {
    const userId = req.user.userId;
    return await this.reviewSettingsService.getGlobalSettings(userId);
  }

  @Post()
  @ApiOperation({ summary: '设置用户全局复习设置' })
  @ApiResponse({
    status: 200,
    description: '成功设置全局复习设置',
    type: GlobalReviewSettingsDto,
  })
  async setGlobalSettings(
    @Body() setGlobalReviewRulesDto: SetGlobalReviewRulesDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GlobalReviewSettingsDto> {
    const userId = req.user.userId;
    return await this.reviewSettingsService.setGlobalSettings(
      userId,
      setGlobalReviewRulesDto,
    );
  }
}
