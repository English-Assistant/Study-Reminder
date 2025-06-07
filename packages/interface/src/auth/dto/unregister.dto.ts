import { IsNotEmpty, IsString } from 'class-validator';

export class UnregisterDto {
  @IsString()
  @IsNotEmpty()
  verificationCode: string;
}
