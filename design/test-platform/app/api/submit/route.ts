import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifySignature } from '../../../lib/security';
import { checkRateLimit } from '../../../lib/rate-limit';
import { verifySessionToken } from '../../../lib/session';
import { EngineFactory } from '../../../lib/engines';

/**
 * 服务端真脱敏中间件：物理剔除后 70% 深度付费字段，仅吐出前 30% 身份定调与量化诱饵
 * 彻底封死前端 F12 删除遮罩 DOM 节点或抓包白嫖漏洞
 */
function stripPremiumContent(finalResult: any, testId: string): any {
  if (!finalResult || typeof finalResult !== 'object') return finalResult;
  const safeResult = { ...finalResult };

  switch (testId) {
    case 'emotional-friction':
      delete safeResult.quote;
      delete safeResult.scenarios;
      delete safeResult.vampires;
      delete safeResult.bestMatch;
      delete safeResult.hiddenCosts;
      delete safeResult.adviceList;
      break;

    case 'destiny-lover':
      delete safeResult.firstMeet;
      delete safeResult.redFlags;
      delete safeResult.loveAdvice;
      break;

    case 'love-species':
      delete safeResult.behavior;
      delete safeResult.redFlag;
      delete safeResult.careGuide;
      delete safeResult.breakdownScenes;
      delete safeResult.hiddenCost;
      delete safeResult.selfCureGuide;
      delete safeResult.toxicScenario;
      delete safeResult.bestMatch;
      delete safeResult.toxicMatch;
      break;

    case 'family-origin':
      delete safeResult.childhoodMark;
      delete safeResult.triggers;
      delete safeResult.antidoteList;
      break;

    default:
      break;
  }

  return safeResult;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // --- 1. Security Seam: Signature & Rate Limit & Session Validation ---
    
    // 验证签名防重放
    const timestamp = request.headers.get('x-timestamp');
    const signature = request.headers.get('x-sign');
    const isValid = await verifySignature(timestamp, signature, rawBody, 120);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Unauthorized signature' }, { status: 403 });
    }

    // 验证 Session Token (HttpOnly Cookie)
    // 相比依赖前端明文传递的 deviceId，此方案彻底隔绝了伪造和串号可能
    let participantId = 'unknown';
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/test_session=([^;]+)/);
    
    if (match && match[1]) {
      const payload = await verifySessionToken(match[1]);
      if (payload && payload.participantId) {
        participantId = payload.participantId;
      }
    }

    // 如果不存在 Cookie，则阻断提交 (强制开启强力防刷防串号保护)
    if (participantId === 'unknown') {
      return NextResponse.json({ success: false, error: 'Session expired or missing. Please initialize test first.' }, { status: 401 });
    }

    // 频控：使用 Redis Rate Limit (单会话+IP联合限制，或者全局限制)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const identifier = `${participantId}_${ip}`;
    const isAllowed = await checkRateLimit(identifier, 10, 60000); // 每分钟最多 10 次提交
    if (!isAllowed) {
      return NextResponse.json({ success: false, error: 'Too many requests, please slow down' }, { status: 429 });
    }

    // --- 2. Turnstile 人机验证 ---
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    const { answers, testId = 'emotional-friction', turnstileToken, metadata, deviceId } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ success: false, error: '无有效答案数据' }, { status: 400 });
    }

    if (turnstileSecret && turnstileToken) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(turnstileToken)}`,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          console.warn('[Submit API] Turnstile verification failed:', verifyData);
          if (process.env.NODE_ENV === 'production' && participantId === 'unknown') {
            return NextResponse.json({ success: false, error: '人机验证未通过，请重试' }, { status: 403 });
          }
        }
      } catch (e) {
        console.warn('Turnstile verification network timeout, gracefully continuing based on valid session signature:', e);
      }
    }


    // --- 3. Routing to specific Engine (Scoring Engine Seam) ---
    const optionIds: string[] = Object.values(answers).map((v: any) => {
      if (typeof v === 'string' || typeof v === 'number') return v.toString();
      return v?.id?.toString();
    }).filter(Boolean);

    const engine = EngineFactory.getEngine(testId);
    
    // Engine 的计算过程是一个纯逻辑过程，具有高 Locality 和扩展性
    const finalResult = await engine.calculate({ optionIds, metadata, testId });

    // --- 4. 统一持久化存储 ---
    let recordId: string | number = 1;
    let participantCount = 10000;
    
    try {
      // 记录存储时优先使用前端设备 deviceId 以便历史回查，兜底使用服务端 participantId
      const targetDeviceId = (deviceId && typeof deviceId === 'string' && deviceId.trim().length > 0) 
        ? deviceId.trim() 
        : participantId;

      const record = await prisma.testRecord.create({
        data: {
          testId,
          deviceId: targetDeviceId, 
          answers: JSON.stringify(answers),
          resultId: typeof finalResult.id === 'number' ? finalResult.id : 1
        }
      });
      recordId = record.id;
      
      const recordCount = await prisma.testRecord.count({ where: { testId } });
      const config = await prisma.globalConfig.findFirst({ where: { testId } });
      
      let extraBase = testId === 'family-origin' ? 85300 : (testId === 'love-species' ? 12544 : 0);
      if (config) {
        extraBase = config.baseCount || extraBase;
        if (config.danmakuContent) {
          try {
            const dContent = JSON.parse(config.danmakuContent);
            if (typeof dContent.completedBaseCount === 'number') {
              extraBase = dContent.completedBaseCount;
            }
          } catch (e) {}
        }
      }
      participantCount = extraBase + recordCount;
      
    } catch (dbErr) {
      console.warn('DB error creating testRecord, gracefully continuing.');
    }
    // --- 5. 返回统一格式响应（经过服务端真脱敏，物理阻断 F12 白嫖） ---
    const strippedResult = stripPremiumContent(finalResult, testId);

    return NextResponse.json({
      success: true,
      recordId,
      participantCount,
      result: strippedResult
    });

  } catch (error: any) {
    console.error('Submit error:', error);
    return NextResponse.json({ success: false, error: '提交失败: ' + (error.message || '') }, { status: 500 });
  }
}
