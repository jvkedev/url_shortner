import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;
  private readonly logger = new Logger(Redis.name);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.getOrThrow<string>('redisHost');
    const port = this.configService.getOrThrow<number>('redisPort');

    this.redis = new Redis({
      host,
      port,
    });

    this.redis
      .ping()
      .then((result) => this.logger.log(result))
      .catch((error: Error) => this.logger.error(error.message));
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl: string) {
    if (ttl) {
      await this.redis.set(key, value, 'EX', ttl);
      return;
    }

    await this.redis.set(key, value);
  }

  async del(key: string) {
    await this.redis.del(key);
  }
}
