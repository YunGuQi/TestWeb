import { describe, expect, it } from 'vitest';
import {
  calculateCountdownState,
  formatCountdown,
  formatCountdownChinese,
} from '../lib/countdown';

describe('倒计时格式化与状态算法单测 (Countdown Unit Tests)', () => {
  describe('formatCountdown: 紧凑时分秒格式化', () => {
    it('负数、零与异常值安全返回 "00:00"', () => {
      expect(formatCountdown(-1)).toBe('00:00');
      expect(formatCountdown(-50000)).toBe('00:00');
      expect(formatCountdown(0)).toBe('00:00');
      expect(formatCountdown(NaN)).toBe('00:00');
      expect(formatCountdown(null as unknown as number)).toBe('00:00');
      expect(formatCountdown(undefined as unknown as number)).toBe('00:00');
    });

    it('毫秒与微小差值 (< 1秒) 规整为 "00:00"', () => {
      expect(formatCountdown(200)).toBe('00:00');
      expect(formatCountdown(999)).toBe('00:00');
    });

    it('不足 1 分钟的秒级输出 mm:ss 格式', () => {
      expect(formatCountdown(1000)).toBe('00:01');
      expect(formatCountdown(1500)).toBe('00:01');
      expect(formatCountdown(10000)).toBe('00:10');
      expect(formatCountdown(45000)).toBe('00:45');
      expect(formatCountdown(59000)).toBe('00:59');
    });

    it('大于等于 1 分钟且小于 1 小时输出 mm:ss 格式', () => {
      expect(formatCountdown(60000)).toBe('01:00');
      // 14 分 32 秒 = (14 * 60 + 32) * 1000 = 872000 ms
      expect(formatCountdown(872000)).toBe('14:32');
      // 59 分 59 秒 = (59 * 60 + 59) * 1000 = 3599000 ms
      expect(formatCountdown(3599000)).toBe('59:59');
    });

    it('大于等于 1 小时输出 HH:mm:ss 格式', () => {
      // 1 小时整 = 3600000 ms
      expect(formatCountdown(3600000)).toBe('01:00:00');
      // 1 小时 5 分 2 秒 = 3600000 + 300000 + 2000 = 3902000 ms
      expect(formatCountdown(3902000)).toBe('01:05:02');
      // 10 小时 = 36000000 ms
      expect(formatCountdown(36000000)).toBe('10:00:00');
    });
  });

  describe('formatCountdownChinese: 中文自然语言格式化', () => {
    it('负数、零与异常值返回 "即将执行"', () => {
      expect(formatCountdownChinese(-1)).toBe('即将执行');
      expect(formatCountdownChinese(-3000)).toBe('即将执行');
      expect(formatCountdownChinese(0)).toBe('即将执行');
      expect(formatCountdownChinese(NaN)).toBe('即将执行');
      expect(formatCountdownChinese(null as unknown as number)).toBe('即将执行');
      expect(formatCountdownChinese(undefined as unknown as number)).toBe('即将执行');
    });

    it('毫秒与微小差值 (< 1秒) 规整为 "即将执行"', () => {
      expect(formatCountdownChinese(500)).toBe('即将执行');
      expect(formatCountdownChinese(999)).toBe('即将执行');
    });

    it('不足 1 分钟输出纯秒数，如 "45 秒"', () => {
      expect(formatCountdownChinese(1000)).toBe('1 秒');
      expect(formatCountdownChinese(10000)).toBe('10 秒');
      expect(formatCountdownChinese(45000)).toBe('45 秒');
      expect(formatCountdownChinese(59000)).toBe('59 秒');
    });

    it('大于等于 1 分钟且小于 1 小时输出如 "14 分 32 秒"', () => {
      expect(formatCountdownChinese(60000)).toBe('1 分 0 秒');
      expect(formatCountdownChinese(872000)).toBe('14 分 32 秒');
      expect(formatCountdownChinese(3599000)).toBe('59 分 59 秒');
    });

    it('大于等于 1 小时输出如 "1 小时 5 分 2 秒"', () => {
      expect(formatCountdownChinese(3600000)).toBe('1 小时 0 分 0 秒');
      expect(formatCountdownChinese(3902000)).toBe('1 小时 5 分 2 秒');
    });

    it('超时超过 60 秒 (diffMs < -60000) 输出 ⚠️ 已超时未执行', () => {
      expect(formatCountdownChinese(-60001)).toBe('⚠️ 已超时未执行');
      expect(formatCountdownChinese(-120000)).toBe('⚠️ 已超时未执行');
      expect(formatCountdownChinese(-3600000)).toBe('⚠️ 已超时未执行');
    });
  });

  describe('calculateCountdownState: 目标时间与紧急态判定', () => {
    it('空目标或无效时间返回 finished 态', () => {
      const emptyRes = calculateCountdownState(null);
      expect(emptyRes.isFinished).toBe(true);
      expect(emptyRes.isUrgent).toBe(false);
      expect(emptyRes.remainingMs).toBe(0);
      expect(emptyRes.formatted).toBe('00:00');
      expect(emptyRes.chineseFormatted).toBe('即将执行');

      const invalidRes = calculateCountdownState('invalid-iso-string');
      expect(invalidRes.isFinished).toBe(true);
      expect(invalidRes.remainingMs).toBe(0);
    });

    it('已过期的时间返回 finished 态，并在 60 秒内判定为调度中', () => {
      const now = 1000000;
      const target = new Date(now - 5000).toISOString();
      const res = calculateCountdownState(target, now);
      expect(res.isFinished).toBe(true);
      expect(res.isUrgent).toBe(false);
      expect(res.remainingMs).toBe(0);
      expect(res.diffMs).toBe(-5000);
      expect(res.isDispatching).toBe(true);
      expect(res.isOverdue).toBe(false);
      expect(res.chineseFormatted).toBe('⏳ 调度中...');
    });

    it('严重超时 (> 60 秒) 判定为 isOverdue 且提示超时未执行', () => {
      const now = 1000000;
      const target = new Date(now - 90000).toISOString();
      const res = calculateCountdownState(target, now);
      expect(res.isFinished).toBe(true);
      expect(res.isUrgent).toBe(false);
      expect(res.remainingMs).toBe(0);
      expect(res.diffMs).toBe(-90000);
      expect(res.isDispatching).toBe(false);
      expect(res.isOverdue).toBe(true);
      expect(res.chineseFormatted).toBe('⚠️ 已超时未执行');
    });

    it('剩余时间 <= 10 秒时标记 isUrgent 为 true', () => {
      const now = 1000000;
      const target = new Date(now + 8000).toISOString();
      const res = calculateCountdownState(target, now);
      expect(res.isFinished).toBe(false);
      expect(res.isUrgent).toBe(true);
      expect(res.remainingMs).toBe(8000);
      expect(res.formatted).toBe('00:08');
      expect(res.chineseFormatted).toBe('8 秒');
    });

    it('剩余时间 > 10 秒时 isUrgent 为 false', () => {
      const now = 1000000;
      const target = new Date(now + 15000).toISOString();
      const res = calculateCountdownState(target, now);
      expect(res.isFinished).toBe(false);
      expect(res.isUrgent).toBe(false);
      expect(res.remainingMs).toBe(15000);
      expect(res.formatted).toBe('00:15');
      expect(res.chineseFormatted).toBe('15 秒');
    });

    it('支持数字时间戳与 Date 对象入参', () => {
      const now = 1000000;
      const targetMs = now + 872000;
      const resNum = calculateCountdownState(targetMs, now);
      expect(resNum.formatted).toBe('14:32');
      expect(resNum.chineseFormatted).toBe('14 分 32 秒');

      const resDate = calculateCountdownState(new Date(targetMs), now);
      expect(resDate.formatted).toBe('14:32');
    });
  });
});
