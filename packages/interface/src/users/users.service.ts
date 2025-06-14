import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export type UserWithoutPassword = Omit<User, 'password'>;

/**
 * 用户服务
 * ------------------------------------------------------------
 * 负责所有与 User 表交互的基础操作：创建用户、按用户名/ID 查询等。
 */
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建新用户
   * @param username 用户名（唯一）
   * @param passwordRaw 明文密码，将在此方法内加盐哈希
   * @param email 邮箱地址
   * @returns 去除密码字段后的用户对象
   */
  async createUser(
    username: string,
    passwordRaw: string,
    email: string,
  ): Promise<UserWithoutPassword> {
    const hashedPassword = await bcrypt.hash(passwordRaw, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  /**
   * 通过用户名查找用户（包含密码字段）
   */
  findOneByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * 通过 ID 查找用户，并去除密码字段。
   */
  async findOneById(id: string): Promise<UserWithoutPassword | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
