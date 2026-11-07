import { Redis } from 'ioredis';

const globalForRedis = global as unknown as {
  redis: Redis | undefined;
};

// 使用单例模式防止开发环境热重载时产生大量 Redis 实例
export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      // 达到重试上限就不再重试，防止阻塞太久
      if (times > 3) return null;
      return Math.min(times * 50, 2000);
    }
  });

// 监听错误防止进程崩溃
redis.on('error', (err) => {
  console.error('Redis client error:', err);
});

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
