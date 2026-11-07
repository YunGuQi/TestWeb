import { chromium, Browser, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import QRCode from 'qrcode';
import { destinyLoverResults } from '../lib/destiny-lover-data';
import { CITY_RESULTS_FALLBACK } from '../lib/city-fallback';
import { results as emoResults } from '../lib/data';
import { familyOriginResults } from '../lib/family-origin-data';
import { loveSpeciesResults } from '../lib/love-species-data';
import { SPECIES_SUMMARIES_DATA } from '../lib/love-species-client';
import { getSlugByCityName, getSlugByEmoKey } from '../lib/preview-slugs';

const PREVIEW_SECRET = process.env.ADMIN_PREVIEW_SECRET || 'mutong-preview-secret-2026';

interface CliArgs {
  testId: string;
  baseUrl: string;
  simulate: boolean;
  limit: number;
  headless: boolean;
  openFolder: boolean;
  unlockCode: string;
  secret: string;
}

// 标准测试标识与中文目录名称映射字典 (严格对齐 design/product-docs/ 目录)
interface TestMeta {
  chineseName: string;
  defaultRoute: string;
  isDiscovered?: boolean;
}

const BASE_TEST_META_MAP: Record<string, TestMeta> = {
  'emo': { chineseName: '深度情绪内耗', defaultRoute: '/emo' },
  'destiny-lover': { chineseName: '命定恋人', defaultRoute: '/destiny-lover' },
  'city': { chineseName: '性格城市匹配', defaultRoute: '/city' },
  'family-origin': { chineseName: '大女主觉醒测试', defaultRoute: '/family-origin' },
  'love-species': { chineseName: '恋爱物种领养中心', defaultRoute: '/love-species' }
};

// 动态自动识别扫描现有和新增的测试项目
function discoverAvailableTests(): Record<string, TestMeta> {
  const metaMap: Record<string, TestMeta> = { ...BASE_TEST_META_MAP };
  try {
    const appDir = path.resolve(__dirname, '..', 'app');
    const productDocsDir = path.resolve(__dirname, '..', '..', 'product-docs');

    // 1. 扫描 design/product-docs/ 目录下的中文文件夹
    const docFolders: { name: string; fullPath: string }[] = [];
    if (fs.existsSync(productDocsDir)) {
      const entries = fs.readdirSync(productDocsDir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.isDirectory() && ent.name !== 'common') {
          docFolders.push({ name: ent.name, fullPath: path.join(productDocsDir, ent.name) });
        }
      }
    }

    // 2. 扫描 design/test-platform/app/ 目录下的业务路由
    const ignoredAppDirs = new Set(['api', 'ops-dashboard', 'ops-login', 'components', 'utils', 'lib', 'styles']);
    if (fs.existsSync(appDir)) {
      const appEntries = fs.readdirSync(appDir, { withFileTypes: true });
      for (const ent of appEntries) {
        if (!ent.isDirectory() || ignoredAppDirs.has(ent.name)) continue;
        const slug = ent.name;
        if (!metaMap[slug]) {
          // 尝试匹配中文名称
          let matchedName = slug;
          for (const df of docFolders) {
            const profileMd = path.join(df.fullPath, 'docs', '测试画像.md');
            if (fs.existsSync(profileMd)) {
              const text = fs.readFileSync(profileMd, 'utf-8');
              if (text.includes(slug) || text.includes(`/${slug}`)) {
                matchedName = df.name;
                break;
              }
            }
          }
          metaMap[slug] = {
            chineseName: matchedName,
            defaultRoute: `/${slug}`,
            isDiscovered: true
          };
        }
      }
    }

    // 3. 扫描 product-docs 下已存在但尚未匹配到 slug 的业务目录
    const knownChineseNames = new Set(Object.values(metaMap).map(m => m.chineseName));
    for (const df of docFolders) {
      if (!knownChineseNames.has(df.name)) {
        let deducedSlug = df.name.toLowerCase().replace(/[\s\-_]/g, '');
        const profileMd = path.join(df.fullPath, 'docs', '测试画像.md');
        if (fs.existsSync(profileMd)) {
          const text = fs.readFileSync(profileMd, 'utf-8');
          const m = text.match(/route[:：\s]*\/([a-zA-Z0-9_\-]+)/i) || text.match(/slug[:：\s]*([a-zA-Z0-9_\-]+)/i);
          if (m && m[1]) deducedSlug = m[1];
        }
        if (!metaMap[deducedSlug]) {
          metaMap[deducedSlug] = {
            chineseName: df.name,
            defaultRoute: `/${deducedSlug}`,
            isDiscovered: true
          };
        }
      }
    }
  } catch (err) {
    // 容错降级
  }
  return metaMap;
}

// 预设可用卡密字典
const DEFAULT_CODES: Record<string, string> = {
  'emo': 'EMO-PMDWU0V5',
  'destiny-lover': 'DESTINY-VIP-2026',
  'city': 'CITY-PASS-2026',
  'family-origin': 'FAM-VIP-2026',
  'love-species': 'LOVE-VIP-2026'
};

// 全局单例 readline 实例，杜绝因 close 导致的输入流被强行关闭
let globalRl: readline.Interface | null = null;
function getReadline(): readline.Interface {
  if (!globalRl) {
    globalRl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  return globalRl;
}

function askQuestion(query: string, defaultVal: string = ''): Promise<string> {
  const rl = getReadline();
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      resolve(ans.trim() || defaultVal);
    });
  });
}

function closeReadline() {
  if (globalRl) {
    globalRl.close();
    globalRl = null;
  }
}

async function resolveArgs(isInteractiveMode: boolean = false, previousEnv: string = ''): Promise<CliArgs | null> {
  const args = process.argv.slice(2);
  let testId = '';
  let baseUrl = previousEnv || 'https://test.mutong-xhs.top';
  let simulate = false;
  let limit = 0;
  let headless = true;
  let openFolder = true;
  let unlockCode = '';
  let secret = PREVIEW_SECRET;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--test' || arg === '-t') {
      testId = args[++i] || testId;
    } else if (arg === '--env' || arg === '-e') {
      baseUrl = args[++i] || baseUrl;
    } else if (arg === '--simulate' || arg === '-s') {
      simulate = true;
    } else if (arg === '--limit' || arg === '-l') {
      limit = parseInt(args[++i], 10) || 0;
    } else if (arg === '--code' || arg === '-c') {
      unlockCode = args[++i] || unlockCode;
    } else if (arg === '--secret') {
      secret = args[++i] || secret;
    } else if (arg === '--no-headless' || arg === '--headed') {
      headless = false;
    } else if (arg === '--no-open') {
      openFolder = false;
    } else if (!arg.startsWith('-') && i === 0) {
      testId = arg;
    }
  }

  const allTests = discoverAvailableTests();
  const testKeys = Object.keys(allTests);

  // 命令行无参或处于多轮交互模式中，展现完整选择菜单
  if ((!testId && !simulate) || isInteractiveMode) {
    console.log('\n====================================================');
    console.log('    小红书测试平台 · 结果页原装长图自动化导出工具');
    console.log('====================================================\n');
    console.log(' 【请选择要截图的测试项目】:');

    // 经典内置测试说明映射
    const descMap: Record<string, string> = {
      'emo': '安安心灵便利店完整超长账单',
      'destiny-lover': '16款心动契约玉牌全长图',
      'city': '逃跑车票全量超清海报',
      'family-origin': '6款大女主觉醒档案',
      'love-species': '16款恋爱物种契约'
    };

    testKeys.forEach((key, idx) => {
      const meta = allTests[key];
      const desc = descMap[key] ? ` - ${descMap[key]}` : '';
      const tag = meta.isDiscovered ? ' [🔍 自动发现新测试]' : '';
      console.log(`   [${idx + 1}] ${meta.chineseName} (${key}${desc})${tag}`);
    });

    const manualIdx = testKeys.length + 1;
    console.log(`   [${manualIdx}] 手动输入测试路由名称`);
    console.log('   [0] 退出工具');
    console.log(`   (直接回车默认: [1] ${allTests[testKeys[0]]?.chineseName || '深度情绪内耗'})\n`);

    const choice = await askQuestion(`请输入测试编号 [1-${manualIdx}, 0退出, 默认 1]: `, '1');
    if (choice === '0' || choice.toLowerCase() === 'q') {
      return null;
    }

    const num = parseInt(choice, 10);
    if (!isNaN(num) && num >= 1 && num <= testKeys.length) {
      testId = testKeys[num - 1];
    } else if (num === manualIdx) {
      testId = await askQuestion('请输入自定义测试路由标识: ', testKeys[0] || 'emo');
    } else {
      // 允许直接输入 slug 或中文名称
      const trimChoice = choice.trim();
      const matched = testKeys.find(k => k.toLowerCase() === trimChoice.toLowerCase() || allTests[k].chineseName === trimChoice);
      testId = matched || testKeys[0] || 'emo';
    }

    console.log('\n 【请选择运行环境】:');
    console.log('   [1] 线上生产环境 (https://test.mutong-xhs.top) [推荐]');
    console.log('   [2] 本地开发环境 (http://localhost:3000)');
    console.log('   [3] 自定义测试环境网址');
    console.log('   (直接回车默认: [1] 线上生产环境)\n');
    const envChoice = await askQuestion('请输入环境编号 [1-3, 默认 1]: ', '1');
    if (envChoice === '2') {
      baseUrl = 'http://localhost:3000';
    } else if (envChoice === '3') {
      baseUrl = await askQuestion('请输入完整网址 (如 https://test.mutong-xhs.top): ', baseUrl);
    } else {
      baseUrl = 'https://test.mutong-xhs.top';
    }

    console.log('\n 【请选择导出模式】:');
    console.log('   [1] 全量画像原装大图导出 (推荐: 100% 模拟结果页保存长图海报，完整不截断)');
    console.log('   [2] 单张测试验证 (仅导出该测试第 1 张结果海报)');
    console.log('   (直接回车默认: [1] 全量导出)\n');
    const modeChoice = await askQuestion('请输入模式编号 [1-2, 默认 1]: ', '1');
    if (modeChoice === '2') {
      limit = 1;
    } else {
      limit = 0;
    }
  }

  // 规范化 testId 与中文映射
  if (!testId) testId = testKeys[0] || 'emo';
  const normalized = testId.toLowerCase().trim();
  const directMatch = testKeys.find(k => k.toLowerCase() === normalized || allTests[k].chineseName.toLowerCase() === normalized);
  if (directMatch) {
    testId = directMatch;
  } else if (['1', 'emo', 'emotional-friction', '情绪内耗', '深度情绪内耗', '心灵便利店'].includes(normalized)) {
    testId = 'emo';
  } else if (['2', 'destiny-lover', 'lover', '宿命恋人', '命定恋人'].includes(normalized)) {
    testId = 'destiny-lover';
  } else if (['3', 'city', 'city-personality', '城市性格', '性格城市匹配', '逃跑车票'].includes(normalized)) {
    testId = 'city';
  } else if (['4', 'family-origin', 'family', '原生家庭', '大女主', '大女主觉醒测试', '大女主觉醒'].includes(normalized)) {
    testId = 'family-origin';
  } else if (['5', 'love-species', 'species', '恋爱物种', '恋爱物种领养中心'].includes(normalized)) {
    testId = 'love-species';
  }

  if (!unlockCode) {
    unlockCode = DEFAULT_CODES[testId] || 'EMO-PMDWU0V5';
  }

  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

  return { testId, baseUrl, simulate, limit, headless, openFolder, unlockCode, secret };
}

// 情绪内耗 6 大画像真实常模排位与摩擦账单数据模型 (严格对齐 emo.engine.ts 心理学常模标准)
const EMO_PROFILE_STATS: Record<string, {
  rankSen: number; rankRum: number; rankPls: number; rankBnd: number; rankAvd: number; rankBlm: number;
  totalFriction: number; overallRank: number; overallText: string;
}> = {
  low: {
    rankSen: 8.5, rankRum: 6.2, rankPls: 4.8, rankBnd: 98.2, rankAvd: 92.4, rankBlm: 5.6,
    totalFriction: 4800, overallRank: 99, overallText: '击败 99% 脆皮人类 · 钝感力天花板'
  },
  bnd: {
    rankSen: 28.6, rankRum: 24.1, rankPls: 18.5, rankBnd: 92.4, rankAvd: 85.0, rankBlm: 21.3,
    totalFriction: 28500, overallRank: 86, overallText: '击败 86% 脆皮人类 · 情绪精算师'
  },
  sen: {
    rankSen: 96.8, rankRum: 68.4, rankPls: 62.1, rankBnd: 15.2, rankAvd: 28.5, rankBlm: 72.4,
    totalFriction: 64000, overallRank: 35, overallText: '击败 35% 脆皮人类 · 深海超敏感知者'
  },
  rum: {
    rankSen: 72.4, rankRum: 97.5, rankPls: 54.2, rankBnd: 22.8, rankAvd: 35.1, rankBlm: 93.6,
    totalFriction: 76500, overallRank: 22, overallText: '击败 22% 脆皮人类 · 午夜脑内推演剧场'
  },
  pls: {
    rankSen: 65.1, rankRum: 58.6, rankPls: 98.2, rankBnd: 9.5, rankAvd: 12.4, rankBlm: 88.5,
    totalFriction: 71200, overallRank: 29, overallText: '击败 29% 脆皮人类 · 习惯性顾全大局'
  },
  mix: {
    rankSen: 98.5, rankRum: 98.2, rankPls: 91.4, rankBnd: 6.8, rankAvd: 11.2, rankBlm: 97.6,
    totalFriction: 92000, overallRank: 5, overallText: '击败 5% 脆皮人类 · 灵魂透支大户'
  }
};

async function normalizeEmoDimensions(page: Page, key: string) {
  const stats = EMO_PROFILE_STATS[key] || EMO_PROFILE_STATS['low'];
  await page.evaluate((s) => {
    const dims = [
      { id: 'sen', val: s.rankSen },
      { id: 'rum', val: s.rankRum },
      { id: 'pls', val: s.rankPls },
      { id: 'bnd', val: s.rankBnd },
      { id: 'avd', val: s.rankAvd },
      { id: 'blm', val: s.rankBlm }
    ];
    dims.forEach(d => {
      const scoreEl = document.getElementById(`score-${d.id}`);
      if (scoreEl) scoreEl.innerText = `超越 ${d.val.toFixed(1)}% 脆皮人类`;
      const barEl = document.getElementById(`bar-${d.id}`);
      if (barEl) barEl.style.width = `${d.val.toFixed(1)}%`;
    });

    const bannerBox = document.querySelector('.bg-black.text-white.font-mono');
    if (bannerBox && s.overallText) {
      bannerBox.textContent = `★ ${s.overallText}`;
    }
  }, stats);
}

async function waitFonts(page: Page) {
  try {
    await page.evaluate(() => document.fonts.ready);
  } catch (e) {}
  await page.waitForTimeout(500);
}

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

// 获取各测试完整数据 (用于网络拦截秒过)
function getFullProfileData(testId: string, targetKey: string) {
  if (testId === 'emo' || testId === 'emotional-friction') {
    const match = emoResults.find(r => r.key === targetKey || r.id === targetKey) || emoResults[0];
    return {
      key: match.key,
      title: match.title,
      description: match.description,
      quote: match.quote,
      danmaku: match.danmaku,
      scenarios: match.scenarios || [],
      vampires: match.vampires || '',
      bestMatch: (match as any).bestMatch || '',
      hiddenCosts: match.hiddenCosts || [],
      adviceList: match.adviceList || []
    };
  } else if (testId === 'destiny-lover') {
    const match = destinyLoverResults.find(r => r.key === targetKey) || destinyLoverResults[0];
    return {
      key: match.key,
      title: match.title,
      subtitle: match.subtitle,
      description: match.description,
      quote: match.quote,
      radar: match.radar,
      firstMeet: match.firstMeet,
      redFlags: match.redFlags,
      loveAdvice: match.loveAdvice,
      synergy: match.synergy
    };
  } else if (testId === 'city' || testId === 'city-personality') {
    const match = CITY_RESULTS_FALLBACK.find(r => {
      try {
        const cond = JSON.parse(r.condition);
        return r.id === targetKey || r.title.includes(targetKey) || cond.name === targetKey;
      } catch (e) {
        return r.id === targetKey || r.title.includes(targetKey);
      }
    }) || CITY_RESULTS_FALLBACK[0];
    let extra: any = {};
    try { extra = JSON.parse(match.condition); } catch (e) {}
    return {
      id: match.id,
      title: match.title,
      desc: match.desc,
      description: match.desc,
      quote: match.quote,
      schedule: extra.schedule,
      curePrescription: extra.curePrescription,
      toxicCity: extra.toxicCity
    };
  } else if (testId === 'family-origin') {
    const match = familyOriginResults.find(r => r.id === targetKey || r.name.includes(targetKey)) || familyOriginResults[0];
    return {
      id: match.id,
      name: match.name,
      title: match.name,
      subtitle: match.subtitle,
      acquiredTrait: match.acquiredTrait,
      attachmentType: match.attachmentType,
      quote: match.quote,
      radar: match.radar,
      content: match.content,
      childhoodMark: match.childhoodMark,
      triggers: match.triggers,
      antidoteList: match.antidoteList
    };
  } else if (testId === 'love-species') {
    const match = loveSpeciesResults.find(r => r.key === targetKey || r.title.includes(targetKey)) || 
                  SPECIES_SUMMARIES_DATA.find(r => r.key === targetKey || r.title.includes(targetKey)) || 
                  (loveSpeciesResults[0] as any);
    return {
      key: match.key,
      title: match.title,
      emoji: match.emoji,
      tags: match.tags,
      description: match.description,
      behavior: match.behavior,
      redFlag: match.redFlag,
      careGuide: match.careGuide,
      breakdownScenes: match.breakdownScenes,
      hiddenCost: match.hiddenCost,
      selfCureGuide: match.selfCureGuide,
      toxicScenario: match.toxicScenario,
      bestMatch: match.bestMatch,
      bestMatchReason: (match as any).bestMatchReason,
      toxicMatch: match.toxicMatch,
      toxicMatchReason: (match as any).toxicMatchReason
    };
  }
  return {};
}

// 拦截核销接口，保证所有测试画像无论是否消耗卡密均能拿到完整付费内容
async function setupVerifyInterceptor(page: Page, testId: string) {
  await page.route(/(api\/verify|api\/city\/verify)/, async (route) => {
    let postData: any = {};
    try {
      const raw = route.request().postData();
      if (raw) postData = JSON.parse(raw);
    } catch (e) {}

    const key = postData.resultKey || postData.cityName || postData.cityId || postData.name || '';
    const fullData = getFullProfileData(testId, key);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: '特权核销通过',
        result: fullData,
        unlockedData: fullData
      })
    });
  });
}

// 执行原生保存按钮点击并捕获下载长图
async function captureNativeSavedPoster(page: Page, savePath: string, code: string, beforeSaveHook?: () => Promise<void>): Promise<boolean> {
  const saveBtn = page.locator('#btn-save, button:has-text("保存账单截图"), button:has-text("保存档案截图"), button:has-text("保存心动契约玉牌"), button:has-text("保存领养契约"), button:has-text("保存图片"), button:has-text("保存 / 导出"), button:has-text("保存"), button:has-text("分享我的命定恋人"), button:has-text("分享我的情绪账单"), button:has-text("分享我的觉醒剧本"), button:has-text("分享我的恋爱物种"), button:has-text("分享我的灵魂老家"), button:has-text("灵魂老家"), button:has-text("分享")').first();

  if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    // 第一次点击探测是否被激活拦截（使用 force 防止被遮挡时无限死等）
    try {
      await saveBtn.click({ force: true, timeout: 3000 });
    } catch (e) {}
    await page.waitForTimeout(400);

    // 探测是否需要主动点击开启核销弹窗（如city的列车长验票）
    const showUnlockBtn = page.locator('#btn-show-unlock, button:has-text("【列车长验票】立即检票解锁"), button:has-text("立即检票解锁")').first();
    if (await showUnlockBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      try { await showUnlockBtn.click({ force: true }); } catch(e) {}
      await page.waitForTimeout(300);
    }

    const modal = page.locator('#modal-unlock, div:has-text("验证激活码"), div:has-text("验证授权"), div:has-text("输入你在小红书收到的激活码"), div:has-text("列车长查验"), div:has-text("激活车票"), div:has-text("PASSENGER VERIFICATION")').first();
    if (await modal.isVisible({ timeout: 1500 }).catch(() => false)) {
      console.log('   🔑 检测到卡密激活弹窗，正在自动核销特权...');
      const input = page.locator('#input-verify, input[placeholder*="激活码"], input[type="text"]').first();
      if (await input.isVisible()) {
        await input.fill(code || 'CODE-JIE');
        await page.waitForTimeout(200);
      }
      const verifyBtn = page.locator('#btn-verify, button:has-text("提交验证"), button:has-text("解密档案"), button:has-text("核销"), button:has-text("立即检票通行"), button:has-text("CHECK-IN")').first();
      if (await verifyBtn.isVisible()) {
        await verifyBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    // 确保弹窗已退场
    await page.evaluate(() => {
      document.getElementById('modal-unlock')?.classList.add('hidden');
      // 关闭所有包含列车长查验的fixed全屏弹窗
      document.querySelectorAll('.fixed.inset-0').forEach(el => {
        if (el.textContent?.includes('列车长查验') || el.textContent?.includes('PASSENGER VERIFICATION')) {
          el.remove();
        }
      });
    });
    await waitFonts(page);

    // 在最终生成与下载前执行数据注入钩子（防止 React 重渲染冲掉真实常模数据）
    if (beforeSaveHook) {
      await beforeSaveHook();
      await page.waitForTimeout(200);
    }

    // 优先检测：如果已触发移动端全屏预览弹窗，直接捕获其高精度 Base64 原画，实现 0.1s 极速直出
    const previewImg = page.locator('img[alt*="长图"], img[src^="data:image/png;base64"]').first();
    if (await previewImg.isVisible({ timeout: 3000 }).catch(() => false)) {
      const src = await previewImg.getAttribute('src');
      if (src && src.startsWith('data:image/png;base64,')) {
        const base64Data = src.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(savePath, Buffer.from(base64Data, 'base64'));
        console.log('   📸 成功捕获移动端原装超清长图 (Base64 原画秒级直出)');
        // 及时关闭清理遮罩，避免遮挡后续全景截图
        await page.evaluate(() => {
          document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
        });
        return true;
      }
    }

    // 再次点击保存按钮并捕获原生下载事件
    try {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 3000 }),
        saveBtn.click({ force: true, timeout: 3000 })
      ]);
      await download.saveAs(savePath);
      return true;
    } catch (err) {
      // 再次检查点击后是否在 3 秒内渲染出了长图预览
      const imgAfter = page.locator('img[alt*="长图"], img[src^="data:image/png;base64"]').first();
      if (await imgAfter.isVisible({ timeout: 3000 }).catch(() => false)) {
        const src = await imgAfter.getAttribute('src');
        if (src && src.startsWith('data:image/png;base64,')) {
          const base64Data = src.replace(/^data:image\/png;base64,/, '');
          fs.writeFileSync(savePath, Buffer.from(base64Data, 'base64'));
          console.log('   📸 成功捕获移动端原装超清长图 (Base64 原画直出)');
          await page.evaluate(() => {
            document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
          });
          return true;
        }
      }
      console.warn('   ⚠️ 原生下载等待超时，将启动 DOM 全节点原装长图渲染...');
    }
  }

  // 清理所有可能残留的全屏遮罩，确保 DOM 截图纯净无遮挡
  await page.evaluate(() => {
    document.querySelectorAll('.fixed.inset-0').forEach(el => el.remove());
  });

  if (beforeSaveHook) {
    await beforeSaveHook();
    await page.waitForTimeout(200);
  }

  // 兜底：DOM 全节点无截断长图捕获
  return await captureFullPosterElement(page, savePath);
}

// 展开 DOM 滚动高度截长图 (消除 overflow 滚动截断)
async function captureFullPosterElement(page: Page, savePath: string): Promise<boolean> {
  const containerSelectors = [
    '#poster-container',
    '#xhs-poster',
    'div.receipt-paper',
    '#ticket-capture',
    'div[ref="ticketRef"]',
    'div[ref="receiptRef"]',
    'main > div.max-w-sm',
    'main > div.max-w-md'
  ];

  await page.evaluate(() => {
    const scrollContainers = document.querySelectorAll('.overflow-y-auto, .h-\\[100dvh\\], .min-h-\\[100dvh\\], .h-screen, main');
    scrollContainers.forEach((el: any) => {
      el.style.height = 'auto';
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';
    });
    const bottomBars = document.querySelectorAll('.fixed.bottom-0, .absolute.bottom-0');
    bottomBars.forEach((b: any) => { b.style.display = 'none'; });
  });

  await page.waitForTimeout(400);

  for (const selector of containerSelectors) {
    const el = await page.$(selector);
    if (el) {
      const box = await el.boundingBox();
      if (box && box.width > 200 && box.height > 300) {
        await el.screenshot({ path: savePath });
        return true;
      }
    }
  }

  await page.screenshot({ path: savePath, fullPage: true });
  return true;
}

async function executeSession(config: CliArgs) {
  const allTests = discoverAvailableTests();
  const meta = allTests[config.testId] || { chineseName: config.testId, defaultRoute: `/${config.testId}` };

  console.log('\n====================================================');
  console.log(' 小红书测试结果保存截图生成工具 (原装超长版)');
  console.log('====================================================');
  console.log(`- 目标测试: ${config.testId} (${meta.chineseName})`);
  console.log(`- 服务地址: ${config.baseUrl}`);
  console.log(`- 仿真机制: 💎 模拟测试结果页原生【保存截图】逻辑 (完整海报/全长展开)`);
  console.log(`- 解锁核销: 🔓 自动穿透服务端数据锁，彻底解锁下半段避雷/锦囊/深度分析`);
  console.log(`- 运行方式: ${config.headless ? '无头后台运行' : '显示浏览器界面'}`);
  if (config.limit > 0) console.log(`- 数量限制: 仅采集前 ${config.limit} 张`);
  console.log('====================================================\n');

  // 严格按照大哥指定路径: design/product-docs/<测试中文名称>/assets/结果测试截图/
  const designBaseDir = path.resolve(__dirname, '..', '..');
  const outDir = path.join(designBaseDir, 'product-docs', meta.chineseName, 'assets', '结果测试截图');
  const cardsDir = path.join(outDir, 'cards');
  const fullpagesDir = path.join(outDir, 'fullpages');

  fs.mkdirSync(cardsDir, { recursive: true });
  fs.mkdirSync(fullpagesDir, { recursive: true });

  const browser: Browser = await chromium.launch({
    headless: config.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    acceptDownloads: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  });

  let capturedCount = 0;

  try {
    if (config.testId === 'emo') {
      let list = emoResults;
      if (config.limit > 0) list = list.slice(0, config.limit);
      console.log(`📋 共发现 ${list.length} 款情绪内耗画像，开始生成原装全长账单...`);

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const filePrefix = `${pad(i + 1)}_${item.key}_${item.title.replace(/[【】]/g, '')}`;
        console.log(`[${i + 1}/${list.length}] 正在生成原装长账单: ${item.title}...`);

        const page = await context.newPage();
        await setupVerifyInterceptor(page, config.testId);

        try {
          const emoSlug = getSlugByEmoKey(item.key);
          if (!emoSlug) {
            throw new Error(`[Capture] 致命错误：情绪画像 key "${item.key}" 未在 EMO_SLUG_MAP 中注册混淆 Slug！`);
          }
          const targetUrl = `${config.baseUrl}/emo/preview?slug=${emoSlug}&secret=${encodeURIComponent(config.secret || PREVIEW_SECRET)}`;
          await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
          await waitFonts(page);

          // 注入该画像对应的心理学常模真实排位，彻底消除 0.0%
          await normalizeEmoDimensions(page, item.key);
          await page.waitForTimeout(300);

          // 原装卡片图 (与结果页保存截图一致)
          const cardPath = path.join(cardsDir, `${filePrefix}.png`);
          await captureNativeSavedPoster(page, cardPath, config.unlockCode, async () => {
            await normalizeEmoDimensions(page, item.key);
          });

          // 再次确保维度正常后再截取移动端全景
          await normalizeEmoDimensions(page, item.key);
          const fullPath = path.join(fullpagesDir, `${filePrefix}_full.png`);
          await page.screenshot({ path: fullPath, fullPage: true });

          capturedCount++;
        } finally {
          await page.close();
        }
      }
    } else if (config.testId === 'destiny-lover') {
      let list = destinyLoverResults;
      if (config.limit > 0) list = list.slice(0, config.limit);
      console.log(`📋 共发现 ${list.length} 款宿命恋人画像，开始生成原装全长玉牌海报...`);

      for (let i = 0; i < list.length; i++) {
        const profile = list[i];
        const filePrefix = `${pad(i + 1)}_${profile.key}_${profile.title}`;
        console.log(`[${i + 1}/${list.length}] 正在生成原装心动玉牌: ${profile.title} (${profile.key})...`);

        const fullData = getFullProfileData('destiny-lover', profile.key);
        const page = await context.newPage();
        await setupVerifyInterceptor(page, config.testId);

        try {
          await page.addInitScript((data) => {
            try {
              localStorage.clear();
              localStorage.setItem('quiz_history', JSON.stringify([
                {
                  testId: 'destiny-lover',
                  title: data.title,
                  timestamp: Date.now(),
                  recordId: 'sim-' + data.key,
                  result: data.full
                }
              ]));
              // 注入完全解锁凭据，彻底移除遮罩与高斯模糊
              localStorage.setItem('verified_destiny-lover', JSON.stringify({
                unlocked: true,
                lastVerifiedCode: 'CODE-JIE',
                profiles: {
                  [data.key]: data.full
                }
              }));
            } catch (e) {}
          }, { key: profile.key, title: profile.title, full: fullData });

          await page.goto(`${config.baseUrl}/destiny-lover`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(300);

          const historyBtn = page.locator('button:has-text("[ 查看历史档案 ]")');
          if (await historyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await historyBtn.click();
            await page.waitForTimeout(300);
            const reviewBtn = page.locator('div[role="dialog"] button:has-text("回顾"), div.fixed button:has-text("回顾")').first();
            if (await reviewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await reviewBtn.click();
              await page.waitForTimeout(600);
            }
          }

          await waitFonts(page);
          const cardPath = path.join(cardsDir, `${filePrefix}.png`);
          await captureNativeSavedPoster(page, cardPath, config.unlockCode);

          const fullPath = path.join(fullpagesDir, `${filePrefix}_full.png`);
          await captureFullPosterElement(page, fullPath);

          capturedCount++;
        } finally {
          await page.close();
        }
      }
    } else if (config.testId === 'city') {
      // 权威对齐系统题库/结果库 lib/city-fallback.ts 真实包含的 16 座性格契合城市
      const cityList = [
        '深圳', '上海', '北京', '广州', '成都', '重庆', '长沙', '武汉',
        '杭州', '苏州', '大理', '阿勒泰', '青岛', '厦门', '西安', '三亚'
      ];
      let list = cityList;
      if (config.limit > 0) list = list.slice(0, config.limit);
      console.log(`📋 共发现 ${list.length} 座性格契合城市，开始生成原装逃跑车票...`);

      for (let i = 0; i < list.length; i++) {
        const cityName = list[i];
        const filePrefix = `${pad(i + 1)}_${cityName}`;
        console.log(`[${i + 1}/${list.length}] 正在生成原装城市车票: ${cityName}...`);

        const fullCityData = getFullProfileData('city', cityName);
        const shareUrl = `${config.baseUrl}/city?utm_source=poster&utm_medium=qrcode&city=${encodeURIComponent(cityName)}`;
        const qrSvg = await QRCode.toString(shareUrl, {
          type: 'svg',
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        }).catch(() => '');

        const page = await context.newPage();
        // 核心：设置 520px 视口，完美还原电脑端 max-w-md 448px 居中卡片与 416px 车票宽度比例
        await page.setViewportSize({ width: 520, height: 1080 });
        await setupVerifyInterceptor(page, config.testId);

        try {
          await page.addInitScript((data) => {
            try {
              localStorage.clear();
              localStorage.setItem('verified_city-personality', JSON.stringify({
                unlocked: true,
                lastVerifiedCode: 'CODE-JIE',
                cityName: data.name,
                data: data.full,
                profiles: {
                  [data.name]: data.full
                }
              }));
            } catch (e) {}
          }, { name: cityName, full: fullCityData });

          const citySlug = getSlugByCityName(cityName);
          if (!citySlug) {
            throw new Error(`[Capture] 致命错误：城市 "${cityName}" 未在 CITY_SLUG_MAP 中注册混淆 Slug！`);
          }
          const targetUrl = `${config.baseUrl}/city/preview?slug=${citySlug}&secret=${encodeURIComponent(config.secret || PREVIEW_SECRET)}`;
          await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
          
          // 页面内再次写入双保险凭据
          await page.evaluate((data) => {
            try {
              localStorage.setItem('verified_city-personality', JSON.stringify({
                unlocked: true,
                lastVerifiedCode: 'CODE-JIE',
                cityName: data.name,
                data: data.full,
                profiles: {
                  [data.name]: data.full
                }
              }));
            } catch (e) {}
          }, { name: cityName, full: fullCityData });

          // 确保主动贯通核销：如果页面出现列车长验票遮罩，主动触发验票
          const unlockBtn = page.locator('#btn-show-unlock, button:has-text("【列车长验票】立即检票解锁")').first();
          if (await unlockBtn.isVisible({ timeout: 1200 }).catch(() => false)) {
            await unlockBtn.click({ force: true });
            await page.waitForTimeout(300);
            const input = page.locator('input[placeholder*="激活码"], #input-verify').first();
            if (await input.isVisible({ timeout: 1200 }).catch(() => false)) {
              await input.fill(config.unlockCode || 'CODE-JIE');
              await page.waitForTimeout(200);
            }
            const verifyBtn = page.locator('button:has-text("立即检票通行"), button:has-text("CHECK-IN"), #btn-verify').first();
            if (await verifyBtn.isVisible({ timeout: 1200 }).catch(() => false)) {
              await verifyBtn.click({ force: true });
              await page.waitForTimeout(1000);
            }
          }

          await waitFonts(page);
          await page.waitForTimeout(500);

          // 注入切片与二维码确保钩子（双重兜底，使海报与电脑端在线测试100%一致）
          await page.evaluate(({ data, svg }) => {
            // 背景与整洁度调优
            document.body.style.backgroundColor = '#1a1a1a';
            document.documentElement.style.backgroundColor = '#1a1a1a';

            document.querySelectorAll('.fixed.inset-0').forEach(el => {
              if (el.textContent?.includes('列车长查验') || el.textContent?.includes('PASSENGER VERIFICATION')) {
                el.remove();
              }
            });
            // 隐藏底部分享悬浮条与网页端操作链接
            document.querySelectorAll('.fixed.bottom-0').forEach((b: any) => { b.style.display = 'none'; });
            document.querySelectorAll('button, a').forEach((el: any) => {
              if (el.textContent?.includes('分享我的') || el.textContent?.includes('重新购买车票') || el.textContent?.includes('返回测试枢纽')) {
                el.style.display = 'none';
              }
            });

            const ticket = document.getElementById('ticket-capture');
            if (!ticket) return;

            // 1. 消除商业化锁定区的硬编码 540px 最小高度死撑出的巨大空隙
            const minHBox = ticket.querySelector('.min-h-\\[540px\\]') as HTMLElement | null;
            if (minHBox) {
              minHBox.style.minHeight = 'auto';
            }

            // 2. 补齐三大深度生活切片（若尚未渲染）
            if (!ticket.textContent?.includes('24H 隐居日程') && !ticket.textContent?.includes('RETREAT')) {
              // 精准定位金句引言卡片（避免匹配到外层大容器）
              const quoteLeaf = Array.from(ticket.querySelectorAll('*')).find(el => el.children.length === 0 && el.textContent?.includes('“'));
              const quoteBox = (quoteLeaf?.closest('div.italic') || quoteLeaf?.parentElement || null) as HTMLElement | null;
              
              const reportTitle = Array.from(ticket.querySelectorAll('div')).find(d => d.textContent?.trim() === 'DIAGNOSTIC REPORT');
              const targetParent = quoteBox?.parentElement || (ticket.querySelector('.space-y-4') as HTMLElement | null) || reportTitle?.nextElementSibling;

              const schedule = data.schedule || {};
              const cure = data.curePrescription || {};
              const toxic = data.toxicCity || {};

              const container = document.createElement('div');
              container.className = 'city-injected-slices space-y-4 mt-4';
              container.innerHTML = `
                ${(schedule.morning || schedule.afternoon || schedule.night) ? `
                <div class="p-3.5 sm:p-4 rounded border border-current/20 bg-black/5 flex flex-col gap-2.5 shadow-sm">
                  <div class="flex items-center justify-between border-b pb-1.5 border-current/10 gap-2 min-w-0">
                    <span class="font-mono text-[11px] sm:text-xs font-bold tracking-wider whitespace-nowrap shrink-0">[ 24H 隐居日程 · RETREAT ]</span>
                    <span class="font-mono text-[9px] sm:text-[10px] opacity-60 whitespace-nowrap shrink-0">SOUL DIARY</span>
                  </div>
                  <div class="text-xs space-y-2 mt-1">
                    ${schedule.morning ? `<div class="flex items-start gap-2"><span class="font-bold opacity-70 shrink-0 font-mono text-[11px] whitespace-nowrap">🌅 晨光</span><span class="opacity-90 leading-snug break-words">${schedule.morning}</span></div>` : ''}
                    ${schedule.afternoon ? `<div class="flex items-start gap-2"><span class="font-bold opacity-70 shrink-0 font-mono text-[11px] whitespace-nowrap">☕ 午后</span><span class="opacity-90 leading-snug break-words">${schedule.afternoon}</span></div>` : ''}
                    ${schedule.night ? `<div class="flex items-start gap-2"><span class="font-bold opacity-70 shrink-0 font-mono text-[11px] whitespace-nowrap">🌙 深夜</span><span class="opacity-90 leading-snug break-words">${schedule.night}</span></div>` : ''}
                  </div>
                </div>` : ''}

                ${(cure.dazePlace || cure.soulFood || cure.spiritBuddy) ? `
                <div class="p-3.5 sm:p-4 rounded border border-current/20 bg-black/5 flex flex-col gap-2 shadow-sm">
                  <div class="flex items-center justify-between border-b pb-1.5 border-current/10 gap-2 min-w-0">
                    <span class="font-mono text-[11px] sm:text-xs font-bold tracking-wider whitespace-nowrap shrink-0">[ 城市治愈处方 · PRESCRIPTION ]</span>
                    <span class="font-mono text-[9px] sm:text-[10px] opacity-60 whitespace-nowrap shrink-0">Rx ONLY</span>
                  </div>
                  <div class="grid grid-cols-1 gap-2 text-xs mt-1">
                    ${cure.dazePlace ? `<div class="flex items-start gap-1.5 leading-snug break-words"><span class="font-bold opacity-70 shrink-0 whitespace-nowrap">🧘 发呆圣地：</span><span class="opacity-90">${cure.dazePlace}</span></div>` : ''}
                    ${cure.soulFood ? `<div class="flex items-start gap-1.5 leading-snug break-words"><span class="font-bold opacity-70 shrink-0 whitespace-nowrap">🍜 灵魂碳水：</span><span class="opacity-90">${cure.soulFood}</span></div>` : ''}
                    ${cure.spiritBuddy ? `<div class="flex items-start gap-1.5 leading-snug break-words"><span class="font-bold opacity-70 shrink-0 whitespace-nowrap">🤝 精神搭子：</span><span class="opacity-90">${cure.spiritBuddy}</span></div>` : ''}
                  </div>
                </div>` : ''}

                ${toxic.name ? `
                <div class="p-3.5 rounded border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 flex flex-col gap-1.5 shadow-sm">
                  <div class="flex items-center justify-between border-b pb-1 border-red-500/20 gap-2 min-w-0">
                    <span class="font-mono text-[11px] sm:text-xs font-bold tracking-wider whitespace-nowrap shrink-0">⚠️ 相克城市避雷预警</span>
                    <span class="text-[9px] sm:text-[10px] font-mono uppercase bg-red-500/20 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">HIGH HAZARD</span>
                  </div>
                  <div class="text-xs mt-1 break-words">
                    <div class="font-bold text-[13px] mb-0.5 whitespace-nowrap">${toxic.name}</div>
                    <div class="leading-relaxed opacity-90 text-[12px]">${toxic.reason || ''}</div>
                  </div>
                </div>` : ''}
              `;
              if (quoteBox && quoteBox.parentElement) {
                quoteBox.after(container);
              } else if (targetParent) {
                targetParent.appendChild(container);
              }
            }

            // 2. 挂载底部纯前端矢量二维码（对齐保存长图原版）
            if (svg && !ticket.querySelector('#ticket-qrcode-container')) {
              const serialEl = Array.from(ticket.querySelectorAll('div')).find(d => d.textContent?.includes('HEX:') || d.textContent?.includes('PASS') || d.textContent?.includes('SOUL'));
              const lastDivider = ticket.querySelector('.border-t.pt-2') || serialEl;
              const qrContainer = document.createElement('div');
              qrContainer.id = 'ticket-qrcode-container';
              qrContainer.className = 'mt-3 pt-3 border-t-2 border-dashed border-current/30 flex flex-col items-center justify-center text-center w-full select-none';
              qrContainer.innerHTML = `
                <div class="bg-white border-2 border-black p-1.5 shadow-[2.5px_2.5px_0px_#000] inline-block mb-1.5">
                  <div class="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                    ${svg}
                  </div>
                </div>
                <div class="font-mono">
                  <div class="text-[10px] font-black tracking-wider uppercase">
                    [ 扫码开始测试 · 测测契合你灵魂的那座城 ]
                  </div>
                  <p class="text-[8.5px] opacity-70 font-bold mt-0.5 tracking-tight">
                    长按扫码立即测算 · 查收你的专属心灵避难所车票
                  </p>
                </div>
              `;
              if (lastDivider && lastDivider.parentElement) {
                lastDivider.parentElement.insertBefore(qrContainer, lastDivider);
              } else {
                ticket.appendChild(qrContainer);
              }
            }
          }, { data: fullCityData, svg: qrSvg });

          await page.waitForTimeout(300);

          const cardPath = path.join(cardsDir, `${filePrefix}.png`);
          const fullPath = path.join(fullpagesDir, `${filePrefix}_full.png`);

          // 核心截屏：截取 section.page-section 容器，完整输出电脑端标准 448px 视觉比例长图（含顶部定制徽章+416px车票卡片+深色背景边缘+底部二维码）
          const sectionEl = await page.$('section.page-section');
          if (sectionEl) {
            await sectionEl.screenshot({ path: cardPath });
          } else {
            await page.screenshot({ path: cardPath, fullPage: true });
          }

          // 截取完整长图
          await page.screenshot({ path: fullPath, fullPage: true });

          capturedCount++;
        } finally {
          await page.close();
        }
      }
    } else if (config.testId === 'family-origin') {
      let list = familyOriginResults;
      if (config.limit > 0) list = list.slice(0, config.limit);
      console.log(`📋 共发现 ${list.length} 款大女主觉醒档案画像，开始生成原装全长剧本档案...`);

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const filePrefix = `${pad(i + 1)}_${item.id}_${item.name}`;
        console.log(`[${i + 1}/${list.length}] 正在生成大女主觉醒档案: ${item.name} (${item.id})...`);

        const fullFamData = getFullProfileData('family-origin', item.id);
        const page = await context.newPage();
        await setupVerifyInterceptor(page, config.testId);

        try {
          await page.addInitScript((data) => {
            try {
              localStorage.clear();
              localStorage.setItem('quiz_history', JSON.stringify([
                {
                  testId: 'family-origin',
                  title: data.name,
                  timestamp: Date.now(),
                  recordId: 'sim-' + data.id,
                  result: data.full
                }
              ]));
              localStorage.setItem('verified_family-origin', JSON.stringify({
                unlocked: true,
                lastVerifiedCode: 'CODE-JIE',
                profiles: {
                  [data.id]: data.full
                }
              }));
            } catch (e) {}
          }, { id: item.id, name: item.name, full: fullFamData });

          await page.goto(`${config.baseUrl}/family-origin`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(400);

          // 点击历史档案唤起档案室并恢复结果
          const historyBtn = page.locator('button:has-text("历史档案")');
          if (await historyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await historyBtn.click();
            await page.waitForTimeout(300);
            const itemBtn = page.locator('div.fixed button:has-text("ID:")').first();
            if (await itemBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await itemBtn.click();
              await page.waitForTimeout(600);
            }
          }

          await waitFonts(page);
          const cardPath = path.join(cardsDir, `${filePrefix}.png`);
          await captureNativeSavedPoster(page, cardPath, config.unlockCode);

          const fullPath = path.join(fullpagesDir, `${filePrefix}_full.png`);
          await captureFullPosterElement(page, fullPath);

          capturedCount++;
        } finally {
          await page.close();
        }
      }
    } else if (config.testId === 'love-species') {
      let list = loveSpeciesResults;
      if (config.limit > 0) list = list.slice(0, config.limit);
      console.log(`📋 共发现 ${list.length} 款恋爱物种画像，开始生成原装全长领养契约...`);

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const filePrefix = `${pad(i + 1)}_${item.key}_${item.title}`;
        console.log(`[${i + 1}/${list.length}] 正在生成恋爱物种契约: ${item.title} (${item.key})...`);

        const fullSpeciesData = getFullProfileData('love-species', item.key);
        const page = await context.newPage();
        await setupVerifyInterceptor(page, config.testId);

        try {
          await page.addInitScript((data) => {
            try {
              localStorage.clear();
              localStorage.setItem('quiz_history', JSON.stringify([
                {
                  testId: 'love-species',
                  title: data.title,
                  timestamp: Date.now(),
                  recordId: 'sim-' + data.key,
                  result: data.full
                }
              ]));
              localStorage.setItem('verified_love-species', JSON.stringify({
                unlocked: true,
                lastVerifiedCode: 'CODE-JIE',
                profiles: {
                  [data.key]: data.full
                }
              }));
            } catch (e) {}
          }, { key: item.key, title: item.title, full: fullSpeciesData });

          await page.goto(`${config.baseUrl}/love-species`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(400);

          const historyBtn = page.locator('button:has-text("历史图鉴")');
          if (await historyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await historyBtn.click();
            await page.waitForTimeout(300);
            const itemBtn = page.locator('div.fixed button:has-text("No.")').first();
            if (await itemBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await itemBtn.click();
              await page.waitForTimeout(600);
            }
          }

          await waitFonts(page);
          const cardPath = path.join(cardsDir, `${filePrefix}.png`);
          await captureNativeSavedPoster(page, cardPath, config.unlockCode);

          const fullPath = path.join(fullpagesDir, `${filePrefix}_full.png`);
          await captureFullPosterElement(page, fullPath);

          capturedCount++;
        } finally {
          await page.close();
        }
      }
    } else {
      console.log(`📋 正在生成 ${meta.chineseName} 结果海报...`);
      const page = await context.newPage();
      await setupVerifyInterceptor(page, config.testId);
      try {
        const targetUrl = `${config.baseUrl}${meta.defaultRoute}`;
        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await waitFonts(page);

        const filePrefix = `01_${meta.chineseName}`;
        const cardPath = path.join(cardsDir, `${filePrefix}.png`);
        await captureNativeSavedPoster(page, cardPath, config.unlockCode);
        await page.screenshot({ path: path.join(fullpagesDir, `${filePrefix}_full.png`), fullPage: true });
        capturedCount++;
      } finally {
        await page.close();
      }
    }
  } catch (err: any) {
    console.error('❌ 执行发生错误:', err.message || err);
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`🎉 任务执行完毕！共保存 ${capturedCount} 组原装无遮罩完整长截图。`);
  console.log(`📁 保存总目录: ${outDir}`);
  console.log(`📁 核心海报目录: ${cardsDir}`);
  console.log(`📁 全页长图目录: ${fullpagesDir}`);
  console.log('====================================================\n');
}

async function main() {
  const args = process.argv.slice(2);
  const isCli = args.some(arg => arg.startsWith('-') || ['emo', 'city', 'destiny-lover', 'family-origin', 'love-species'].includes(arg));
  let isRepeat = false;
  let lastEnv = '';

  try {
    do {
      const config = await resolveArgs(isRepeat, lastEnv);
      if (!config) {
        break; // 用户选择退出
      }
      lastEnv = config.baseUrl;
      await executeSession(config);

      if (isCli) {
        break;
      }

      console.log('====================================================');
      console.log('  [提示] 当前测试所有原装长图已全部保存完毕！');
      console.log('====================================================');
      const nextAns = await askQuestion('👉 是否继续选择保存下一个测试？[Y=继续保存 / N=退出, 默认 Y]: ', 'Y');
      if (nextAns.toLowerCase() === 'n' || nextAns.toLowerCase() === 'no' || nextAns.toLowerCase() === '0' || nextAns.toLowerCase() === 'q') {
        break;
      }
      isRepeat = true;
    } while (true);
  } finally {
    closeReadline();
  }

  console.log('\n[提示] 工具已安全退出，感谢使用！\n');
}

main().catch((err) => {
  closeReadline();
  console.error(err);
});
