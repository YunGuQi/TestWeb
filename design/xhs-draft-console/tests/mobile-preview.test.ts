import { describe, expect, it } from 'vitest';
import {
  extractTopicsFromText,
  getAllTopics,
  isCoverOverLimit,
  splitTextWithTopics,
} from '../components/MobilePreview';

describe('MobilePreview 组件逻辑与排版测试 (Ticket 02 & 04)', () => {
  describe('话题提取与排版算法', () => {
    it('精确提取正文中出现的所有 #话题 标签并去重', () => {
      const text =
        '天生高敏感？#大女主 #自我提升 勇敢做自己！还有 #大女主 再次出现 #心理学_测试';
      const topics = extractTopicsFromText(text);

      expect(topics).toEqual(['大女主', '自我提升', '心理学_测试']);
      expect(topics.length).toBe(3);
    });

    it('合并正文提取话题与外部传入话题', () => {
      const body = '今天也是元气满满的一天 #日常打卡';
      const extraTopics = ['日常打卡', '治愈系', '#深度测试'];

      const merged = getAllTopics(body, extraTopics);
      expect(merged).toContain('日常打卡');
      expect(merged).toContain('治愈系');
      expect(merged).toContain('深度测试');
      expect(merged.filter((t) => t === '日常打卡').length).toBe(1);
    });

    it('将文本精确分割为普通片段与高亮话题片段', () => {
      const line = '推荐大家看看 #大女主觉醒 这篇内容！#心理学';
      const parts = splitTextWithTopics(line);

      expect(parts).toEqual([
        { text: '推荐大家看看 ', isTopic: false },
        { text: '#大女主觉醒', isTopic: true },
        { text: ' 这篇内容！', isTopic: false },
        { text: '#心理学', isTopic: true },
      ]);
    });

    it('空文本或无话题文本安全降级', () => {
      expect(extractTopicsFromText('')).toEqual([]);
      expect(extractTopicsFromText('没有任何标签的普通文本')).toEqual([]);
      expect(splitTextWithTopics('')).toEqual([]);
      expect(splitTextWithTopics('纯文本')).toEqual([
        { text: '纯文本', isTopic: false },
      ]);
    });
  });

  describe('封面大字字数警告断言 (isCoverOverLimit)', () => {
    it('字数在 16 字硬顶以内时返回 false', () => {
      const coverLines = ['天生话少', '习惯独处', '只是太怕被消耗']; // 4 + 4 + 7 = 15
      expect(isCoverOverLimit(coverLines)).toBe(false);
    });

    it('正好 16 字时返回 false', () => {
      const coverLines = ['一二三四五六七八', '九十甲乙丙丁戊己']; // 16 字
      expect(isCoverOverLimit(coverLines)).toBe(false);
    });

    it('超过 16 字时触发警告返回 true', () => {
      const coverLines = ['天生话少习惯独处', '只是太怕被情绪消耗', '不想迎合']; // 8 + 9 + 4 = 21 字
      expect(isCoverOverLimit(coverLines)).toBe(true);
    });

    it('空数组或无效参数防御', () => {
      expect(isCoverOverLimit([])).toBe(false);
      // @ts-expect-error 测试防御
      expect(isCoverOverLimit(null)).toBe(false);
    });
  });
});
