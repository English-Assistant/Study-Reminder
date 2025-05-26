import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginOrRegisterDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(4, { message: '用户名长度至少为4位' })
  username!: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度至少为8位' })
  password!: string;
}
