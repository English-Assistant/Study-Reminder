import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class SendVerificationCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(['register', 'reset_password'])
  type: string;

  @IsOptional()
  @IsString()
  username?: string;
}
