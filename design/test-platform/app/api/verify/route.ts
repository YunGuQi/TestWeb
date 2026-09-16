import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { destinyLoverResults } from '../../../lib/destiny-lover-data';
import { familyOriginResults } from '../../../lib/family-origin-data';
import { loveSpeciesResults } from '../../../lib/love-species-data';
import { CITY_RESULTS_FALLBACK } from '../../../lib/city-fallback';
import { results as emoResults } from '../../../lib/data';
import { verifySignature } from '../../../lib/security';
import { checkRateLimit } from '../../../lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting（修复缺失 await 的致命安全缺陷，设置每分钟最多 6 次验证尝试）
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = await checkRateLimit(ip, 6, 60000);
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: '操作太频繁，请稍后再试' }, { status: 429 });
    }

    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // 2. Dynamic Signature Validation
    const timestamp = request.headers.get('x-timestamp');
    const signature = request.headers.get('x-sign');
    // 签名验证：防止直接 curl 绕过前端验证
    const isValid = await verifySignature(timestamp, signature, rawBody, 120);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Unauthorized signature' }, { status: 403 });
    }

    const { code, deviceId, testId = 'destiny-lover', recordId, resultKey, nickname = '你', status = 'single' } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: '请输入有效的激活码' }, { status: 400 });
    }

    const trimmedCode = code.trim();
    const currentDevice = deviceId || 'unknown';

    // 3. 使用 Prisma 事务保证原子操作，彻底杜绝并发竞争条件（Race Condition）
    const transactionResult = await prisma.$transaction(async (tx) => {
      const activation = await tx.activationCode.findUnique({
        where: {
          code_testId: {
            code: trimmedCode,
            testId: testId
          }
        }
      });

      if (!activation) {
        return { ok: false, error: '激活码无效或不适用于该测试', status: 400 };
      }

      if (activation.isDisabled) {
        return { ok: false, error: '该激活码已被禁用', status: 403 };
      }

      let devices: string[] = [];
      try {
        devices = JSON.parse(activation.devices || '[]');
      } catch (e) {}

      const maxUses = activation.maxUses || 3;
      const isMasterCode = trimmedCode === 'CODE-JIE';

      // 如果当前设备已经核销过该激活码，直接放行
      if (devices.includes(currentDevice)) {
        return { ok: true, activation };
      }

      // 检查设备数量上限（如果是万能测试码 CODE-JIE 则豁免上限）
      if (!isMasterCode && devices.length >= maxUses) {
        return { ok: false, error: `该卡密已达到最大设备分享上限（最多支持 ${maxUses} 台设备）`, status: 403 };
      }

      // 追加当前设备并原子保存
      if (!devices.includes(currentDevice)) {
        devices.push(currentDevice);
      }
      
      await tx.activationCode.update({
        where: { id: activation.id },
        data: {
          devices: JSON.stringify(devices)
        }
      });

      return { ok: true, activation };
    });

    if (!transactionResult.ok) {
      return NextResponse.json({ success: false, error: transactionResult.error }, { status: transactionResult.status || 400 });
    }

    // 4. 服务端动态组装付费长文数据（服务端真数据锁，杜绝前端源码或 LocalStorage 白嫖）
    let resultData: any = null;
    let activeKey = resultKey;

    // 若未传递 activeKey，尝试从 testRecord 回查对应画像
    if (!activeKey && recordId && recordId !== testId) {
      try {
        const rec = await prisma.testRecord.findUnique({ where: { id: String(recordId) } });
        if (rec && rec.resultId) {
          const cfg = await prisma.resultConfig.findUnique({ where: { id: rec.resultId } });
          if (cfg && cfg.condition) activeKey = cfg.condition;
        }
      } catch (e) {}
    }

    if (testId === 'destiny-lover' && activeKey) {
      const match = destinyLoverResults.find(r => r.key === activeKey) || destinyLoverResults[0];
      let finalDesc = match.description.replace(/{name}/g, nickname);
      if (status === 'dating') {
        finalDesc = finalDesc.replace(/你的命定恋人/g, '你现在的另一半(如果是命定的话)');
      }
      resultData = {
        key: match.key,
        title: match.title,
        subtitle: match.subtitle,
        description: finalDesc,
        quote: match.quote,
        radar: match.radar,
        firstMeet: match.firstMeet,
        redFlags: match.redFlags,
        loveAdvice: match.loveAdvice,
        synergy: match.synergy
      };
    } else if (testId === 'family-origin' && activeKey) {
      const match = familyOriginResults.find(r => r.id === activeKey || r.name === activeKey) || familyOriginResults[0];
      const finalContent = (match.content || '').replace(/{name}/g, nickname);
      resultData = {
        id: match.id,
        name: match.name,
        title: (match as any).title || match.name,
        content: finalContent,
        description: finalContent,
        quote: match.quote,
        radar: match.radar,
        childhoodMark: match.childhoodMark,
        triggers: match.triggers,
        antidoteList: match.antidoteList
      };
    } else if (testId === 'love-species' && activeKey) {
      const match = loveSpeciesResults.find(r => r.key === activeKey || r.id.toString() === activeKey.toString()) || loveSpeciesResults[0];
      const finalDesc = (match.description || '').replace(/{name}/g, nickname);
      resultData = {
        key: match.key,
        title: match.title,
        description: finalDesc,
        behavior: match.behavior,
        redFlag: match.redFlag,
        careGuide: match.careGuide,
        breakdownScenes: match.breakdownScenes,
        hiddenCost: match.hiddenCost,
        selfCureGuide: match.selfCureGuide,
        toxicScenario: match.toxicScenario,
        bestMatch: match.bestMatch,
        bestMatchReason: match.bestMatchReason,
        toxicMatch: match.toxicMatch,
        toxicMatchReason: match.toxicMatchReason
      };
    } else if (testId === 'city-personality' && activeKey) {
      const match = CITY_RESULTS_FALLBACK.find(r => {
        try {
          const cond = JSON.parse(r.condition);
          return r.id === activeKey || r.title.includes(activeKey) || cond.name === activeKey;
        } catch (e) {
          return r.id === activeKey || r.title.includes(activeKey);
        }
      }) || CITY_RESULTS_FALLBACK[0];
      let extra: any = {};
      try { extra = JSON.parse(match.condition); } catch (e) {}
      resultData = {
        id: match.id,
        title: match.title,
        desc: match.desc,
        description: match.desc,
        quote: match.quote,
        schedule: extra.schedule,
        curePrescription: extra.curePrescription,
        toxicCity: extra.toxicCity
      };
    } else if (testId === 'emotional-friction' && activeKey) {
      const match = emoResults.find(r => r.key === activeKey || r.id === activeKey) || emoResults[0];
      resultData = {
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
    }

    return NextResponse.json({
      success: true,
      message: '验证通过',
      result: resultData,
      unlockedData: resultData
    });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, error: '验证失败' }, { status: 500 });
  }
}

