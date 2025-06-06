import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

  findOneByUsername(username: string) {
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
