import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsEmail,
  IsOptional,
} from 'class-validator';

export class LoginOrRegisterDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @MinLength(3)
  username!: string;

  @MinLength(6, { message: '密码长度至少为6位' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsEmail({}, { message: '必须提供有效的邮箱地址' })
  email?: string;
}
