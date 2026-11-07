import { redis } from './redis';

/**
 * 分布式限流方法基于 Redis (Token Bucket 变种 / 简单计数器)
 * @param identifier 用于限流的唯一标识符（如 IP，或者 participant_id）
 * @param limit 窗口期内允许的最大请求数
 * @param windowMs 窗口期时长（毫秒）
 */
export async function checkRateLimit(identifier: string, limit: number, windowMs: number): Promise<boolean> {
  const key = `rate-limit:${identifier}`;
  const windowSeconds = Math.ceil(windowMs / 1000);

  try {
    // 增加 500ms 快速超时保护，避免 Redis 连接超时或重试阻塞整个主流程
    const incrPromise = redis.incr(key);
    const timeoutPromise = new Promise<number>((_, reject) =>
      setTimeout(() => reject(new Error('Redis timeout')), 500)
    );
    const currentCount = await Promise.race([incrPromise, timeoutPromise]);
    
    // 如果是这个窗口内的第一个请求，设置过期时间
    if (currentCount === 1) {
      await Promise.race([
        redis.expire(key, windowSeconds),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis expire timeout')), 300))
      ]).catch(() => {});
    }
    
    if (currentCount > limit) {
      return false; // 超出限流限制
    }
    
    return true;
  } catch (error) {
    // 降级策略：如果 Redis 发生错误或无 Redis 实例，选择放行
    return true;
  }
}
