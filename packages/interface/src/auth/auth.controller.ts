import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  UseGuards,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginOrRegisterDto } from './dto/login-or-register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Setting } from '@prisma/client';
import { UserWithoutPassword } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login-or-register')
  @HttpCode(HttpStatus.OK)
  async loginOrRegister(
    @Body() loginOrRegisterDto: LoginOrRegisterDto,
  ): Promise<{ access_token: string; user: UserWithoutPassword }> {
    return this.authService.loginOrRegister(
      loginOrRegisterDto.username,
      loginOrRegisterDto.password,
      loginOrRegisterDto.email,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  async getUserSettings(
    @Req() req: AuthenticatedRequest,
  ): Promise<Setting | null> {
    return this.authService.getUserSettings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settings')
  async updateUserSettings(
    @Req() req: AuthenticatedRequest,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ): Promise<Setting> {
    return this.authService.updateUserSettings(req.user.id, updateSettingsDto);
  }
}
