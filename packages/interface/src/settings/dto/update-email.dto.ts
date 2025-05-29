import { IsEmail, IsNotEmpty } from 'class-validator';

export class UpdateEmailDto {
  @IsEmail({}, { message: '请输入有效的邮件地址' })
  @IsNotEmpty({ message: '邮件地址不能为空' })
  email: string;
}
