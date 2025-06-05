import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  verificationCode: string;
}
