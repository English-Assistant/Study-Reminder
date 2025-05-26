import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Logger,
} from '@nestjs/common';
import { AuthModuleService } from './auth-module.service';
import { LoginOrRegisterDto } from './dto/login-or-register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserWithoutPassword } from '../users-module/users-module.service';

@Controller('auth')
export class AuthModuleController {
  private readonly logger = new Logger(AuthModuleController.name);

  constructor(private readonly authService: AuthModuleService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login-register')
  async loginOrRegister(@Body() loginOrRegisterDto: LoginOrRegisterDto) {
    this.logger.log(
      `接收到 login-register 请求: ${loginOrRegisterDto.username}`,
    );
    return this.authService.loginOrRegister(
      loginOrRegisterDto.username,
      loginOrRegisterDto.password,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: { user: UserWithoutPassword }): UserWithoutPassword {
    this.logger.log(`用户 ${req.user.username} 请求个人资料`);
    return req.user;
  }
}
