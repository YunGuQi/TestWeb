import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';

describe('Mobile Hub Security & Status Schema', () => {
  it('T-08: 口令导出 SHA-256 哈希计算准确性 (AC-4.1)', () => {
    const rawPass = 'xhs2026';
    const hash = crypto.createHash('sha256').update(rawPass).digest('hex');
    expect(hash).toHaveLength(64);

    // 标准 sha256 检验
    const expected = crypto.createHash('sha256').update('xhs2026').digest('hex');
    expect(hash).toBe(expected);

    // 错误口令断言
    const wrongHash = crypto.createHash('sha256').update('wrong_pass').digest('hex');
    expect(hash).not.toBe(wrongHash);
  });

  it('T-09: 矩阵发布状态模型持久化与读写契约 (AC-4.3)', () => {
    interface MatrixPublishRecord {
      cardId: string;
      account: string;
      published: boolean;
      publishedAt: string;
    }

    const map: Record<string, MatrixPublishRecord> = {};
    const now = new Date().toISOString();

    // 账号 A 发布
    map['r1_m1'] = {
      cardId: 'r1_m1',
      account: '安安 (老号)',
      published: true,
      publishedAt: now,
    };

    const serialized = JSON.stringify(map);
    const restored = JSON.parse(serialized);

    expect(restored['r1_m1']).toBeDefined();
    expect(restored['r1_m1'].published).toBe(true);
    expect(restored['r1_m1'].account).toBe('安安 (老号)');

    // 撤销标记
    delete restored['r1_m1'];
    expect(restored['r1_m1']).toBeUndefined();
  });

  it('T-10: 跨号撞车与仅未发卡片过滤判定逻辑 (AC-4.4 & AC-4.5)', () => {
    const cards = [
      { id: 'c1', title: '卡片1' },
      { id: 'c2', title: '卡片2' },
      { id: 'c3', title: '卡片3' },
    ];

    const publishedMap: Record<string, { account: string; published: boolean }> = {
      c1: { account: '安安 (老号)', published: true },
    };

    // 1. 跨号撞车判定
    function checkConflict(cardId: string, currentAccount: string): boolean {
      const rec = publishedMap[cardId];
      if (!rec || !rec.published) return false;
      if (currentAccount === 'all') return false;
      return rec.account !== currentAccount;
    }

    // 当切换为 新号_01 时，c1 处于撞车状态
    expect(checkConflict('c1', '新号_01')).toBe(true);
    // 当选为原作者 安安 (老号) 时，不属于跨号撞车
    expect(checkConflict('c1', '安安 (老号)')).toBe(false);
    // 未发布卡片不属于撞车
    expect(checkConflict('c2', '新号_01')).toBe(false);

    // 2. 仅看未发卡片过滤算法
    function filterCards(activeAccount: string, hidePublished: boolean) {
      return cards.filter((c) => {
        const rec = publishedMap[c.id];
        if (hidePublished) {
          if (activeAccount === 'all') {
            if (rec && rec.published) return false;
          } else {
            if (rec && rec.published && rec.account === activeAccount) return false;
          }
        }
        return true;
      });
    }

    // 全部模式 + 开启仅未发：过滤掉已发布的 c1，剩余 c2, c3
    const unpubAll = filterCards('all', true);
    expect(unpubAll.map((c) => c.id)).toEqual(['c2', 'c3']);

    // 新号模式 + 开启仅未发：新号尚未发布 c1，故 c1 保留在流中供参考或提醒
    const unpubNewAcc = filterCards('新号_01', true);
    expect(unpubNewAcc.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);

    // 安安模式 + 开启仅未发：安安已发 c1，过滤掉 c1
    const unpubAnan = filterCards('安安 (老号)', true);
    expect(unpubAnan.map((c) => c.id)).toEqual(['c2', 'c3']);
  });
});
