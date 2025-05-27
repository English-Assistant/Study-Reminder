import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UsersModuleService {
  constructor(private prisma: PrismaService) {}

  async createUser(
    username: string,
    passwordRaw: string,
  ): Promise<UserWithoutPassword> {
    const hashedPassword = await bcrypt.hash(passwordRaw, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

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
