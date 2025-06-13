import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );
    const options: RedisOptions = {
      // 允许 URL 形式
      lazyConnect: false,
    } as RedisOptions;
    this.client = new Redis(redisUrl, options);
  }

  getClient(): Redis {
    return this.client;
  }

  // 常用快捷方法
  zAdd(key: string, score: number, member: string) {
    return this.client.zadd(key, score.toString(), member);
  }

  zRangeByScore(key: string, min: number, max: number) {
    return this.client.zrangebyscore(key, min, max);
  }

  expire(key: string, seconds: number) {
    return this.client.expire(key, seconds);
  }

  onModuleDestroy() {
    this.client.quit();
  }
}
