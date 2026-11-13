'use client';

import { useEffect, useRef, useState } from 'react';

export interface CountdownState {
  /** 剩余毫秒数，最小为 0 */
  remainingMs: number;
  /** 目标时间与基准时间毫秒差值（targetMs - now，到期后为负数） */
  diffMs: number;
  /** 紧凑倒计时文本，如 "00:00"、"14:32"、"01:05:02" */
  formatted: string;
  /** 中文倒计时文本，如 "14 分 32 秒"、"即将执行"、"⚠️ 已超时未执行" */
  chineseFormatted: string;
  /** 是否进入紧急倒计时（<= 10 秒且尚未归零） */
  isUrgent: boolean;
  /** 倒计时是否已结束（<= 0） */
  isFinished: boolean;
  /** 超时调度中状态（超时在 60 秒内：diffMs <= 0 && diffMs >= -60000） */
  isDispatching: boolean;
  /** 超时严重未执行（超时超过 60 秒：diffMs < -60000） */
  isOverdue: boolean;
}

/**
 * 将毫秒差值转为友好的倒计时字符串：
 * - diffMs <= 0 返回 "00:00"；
 * - 大于等于 1 小时输出 HH:mm:ss；
 * - 小于 1 小时输出 mm:ss；
 */
export function formatCountdown(diffMs: number): string {
  if (typeof diffMs !== 'number' || isNaN(diffMs) || diffMs <= 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours >= 1) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * 将毫秒差值转为中文描述字符串：
 * - diffMs <= 0 或小于 1 秒输出 "即将执行"；
 * - 大于等于 1 小时输出如 "1 小时 5 分 2 秒"；
 * - 小于 1 小时且大于等于 1 分钟输出如 "14 分 32 秒"；
 * - 小于 1 分钟输出如 "45 秒"；
 */
export function formatCountdownChinese(diffMs: number): string {
  if (typeof diffMs !== 'number' || isNaN(diffMs)) {
    return '即将执行';
  }
  if (diffMs < -60000) {
    return '⚠️ 已超时未执行';
  }
  if (diffMs <= 0) {
    return '即将执行';
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  if (totalSeconds <= 0) {
    return '即将执行';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分 ${seconds} 秒`;
  }
  if (minutes > 0) {
    return `${minutes} 分 ${seconds} 秒`;
  }
  return `${seconds} 秒`;
}

/**
 * 计算给定目标时间与基准时间之间的倒计时状态纯函数
 */
export function calculateCountdownState(
  target?: string | number | Date | null,
  now = Date.now()
): CountdownState {
  if (!target) {
    return {
      remainingMs: 0,
      diffMs: 0,
      formatted: '00:00',
      chineseFormatted: '即将执行',
      isUrgent: false,
      isFinished: true,
      isDispatching: false,
      isOverdue: false,
    };
  }

  const targetMs =
    typeof target === 'number'
      ? target
      : target instanceof Date
        ? target.getTime()
        : new Date(target).getTime();

  if (isNaN(targetMs)) {
    return {
      remainingMs: 0,
      diffMs: 0,
      formatted: '00:00',
      chineseFormatted: '即将执行',
      isUrgent: false,
      isFinished: true,
      isDispatching: false,
      isOverdue: false,
    };
  }

  const diffMs = targetMs - now;
  const remainingMs = Math.max(0, diffMs);
  const isFinished = diffMs <= 0;
  const isUrgent = diffMs > 0 && diffMs <= 10000;
  const isDispatching = diffMs <= 0 && diffMs >= -60000;
  const isOverdue = diffMs < -60000;

  let chinese = formatCountdownChinese(diffMs);
  // 若超时在 60 秒内且为负值，显示「⏳ 调度中...」
  if (isDispatching && diffMs < 0) {
    chinese = '⏳ 调度中...';
  }

  return {
    remainingMs,
    diffMs,
    formatted: formatCountdown(remainingMs),
    chineseFormatted: chinese,
    isUrgent,
    isFinished,
    isDispatching,
    isOverdue,
  };
}

/**
 * 倒计时 React Hook
 *
 * @param targetIsoTime 目标时间戳（ISO 字符串、时间戳数字或 Date）
 * @param onFinish 倒计时归零时的回调函数（仅触发一次）
 */
export function useCountdown(
  targetIsoTime?: string | number | Date | null,
  onFinish?: () => void
): CountdownState {
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const hasTriggeredRef = useRef(false);

  const [state, setState] = useState<CountdownState>(() =>
    calculateCountdownState(targetIsoTime)
  );

  useEffect(() => {
    if (!targetIsoTime) {
      setState({
        remainingMs: 0,
        diffMs: 0,
        formatted: '00:00',
        chineseFormatted: '即将执行',
        isUrgent: false,
        isFinished: true,
        isDispatching: false,
        isOverdue: false,
      });
      return;
    }

    // 重置已触发标记
    hasTriggeredRef.current = false;

    const tick = () => {
      const current = calculateCountdownState(targetIsoTime);
      setState(current);

      if (current.isFinished && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        onFinishRef.current?.();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [targetIsoTime]);

  return state;
}
