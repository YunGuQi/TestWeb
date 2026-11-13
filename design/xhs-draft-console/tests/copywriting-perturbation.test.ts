import { describe, expect, it } from 'vitest';
import * as path from 'path';

// 引用 skill 目录下的单一真源脚本
const skillDataPath = path.resolve(
  __dirname,
  '../../../.cursor/skills/xhs-note-operator/scripts/skill-data.js'
);
const refineNotesPath = path.resolve(
  __dirname,
  '../../../.cursor/skills/xhs-note-operator/scripts/refine-notes.js'
);

const SD = require(skillDataPath);
const Refine = require(refineNotesPath);

describe('copywriting oral perturbation and rhythm cadence', () => {
  it('用例 3.1: skill-data.js 导出 ORAL_PERTURBATION_WORDS 词库且不少于 10 个词', () => {
    expect(Array.isArray(SD.ORAL_PERTURBATION_WORDS)).toBe(true);
    expect(SD.ORAL_PERTURBATION_WORDS.length).toBeGreaterThanOrEqual(10);
    // 关键虚词包含其实、真的、索性等
    expect(SD.ORAL_PERTURBATION_WORDS).toContain('其实');
    expect(SD.ORAL_PERTURBATION_WORDS).toContain('真的');
    expect(SD.ORAL_PERTURBATION_WORDS).toContain('索性');
  });

  it('用例 3.2: refine-notes 检测到正文包含口语虚词返回 pass，无虚词时报警', () => {
    // 样本 A：自然口语扰动，包含虚词且有短行停顿
    const naturalBodyLines = [
      '其实很多时候就是这样。',
      '真的。',
      '下班关机吃碗面，',
      '反倒一身轻松。',
      '索性睡了。',
    ];
    const resPass = Refine.checkCardRhythmAndPerturbation(naturalBodyLines);
    expect(resPass.oralHits.length).toBeGreaterThanOrEqual(2);
    expect(resPass.issues.length).toBe(0);
    expect(resPass.pass).toBe(true);

    // 样本 B：纯公文议论文，无任何口语虚词
    const aiTextBodyLines = [
      '成年人的世界没有容易二字。',
      '面对压力需要学会调节心态。',
      '设定边界方能拥抱内心的安宁。',
      '工作与生活需要取得良好平衡。',
    ];
    const resFail = Refine.checkCardRhythmAndPerturbation(aiTextBodyLines);
    expect(resFail.oralHits.length).toBe(0);
    expect(resFail.pass).toBe(false);
    expect(resFail.issues.some((i: string) => i.includes('网感提示'))).toBe(true);
  });

  it('用例 3.3: refine-notes 检查缺少 <=6 字短行停顿输出节奏提示', () => {
    // 连续 4 行都是 10~14 字的长句（一堵墙），无 <=6 字短行
    const wallBodyLines = [
      '其实每天下班回到家都很疲惫，',
      '真的不知道如何面对明天的挑战，',
      '但是我们仍然必须努力坚持下去，',
      '不过生活总会有柳暗花明的一天。',
    ];
    const resWall = Refine.checkCardRhythmAndPerturbation(wallBodyLines);
    expect(resWall.shortLines.length).toBe(0);
    expect(resWall.issues.some((i: string) => i.includes('节奏提示'))).toBe(true);
    expect(resWall.issues.some((i: string) => i.includes('一堵墙'))).toBe(true);
  });
});
