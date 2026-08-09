import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { destinyLoverResults } from '../../../lib/destiny-lover-data';
import { verifySignature } from '../../../lib/security';
import { checkRateLimit } from '../../../lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip, 10, 60000)) {
      return NextResponse.json({ success: false, error: '操作太频繁，请稍后再试' }, { status: 429 });
    }

    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // 2. Dynamic Signature Validation
    const timestamp = request.headers.get('x-timestamp');
    const signature = request.headers.get('x-sign');
    // const isValid = await verifySignature(timestamp, signature, rawBody, 120);
    // if (!isValid) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized signature' }, { status: 403 });
    // }

    const { code, deviceId, testId = 'destiny-lover', recordId, resultKey, nickname = '你', status = 'single' } = body;

    // Find code strictly scoped to this test
    const activation = await prisma.activationCode.findUnique({
      where: {
        code_testId: {
          code: code,
          testId: testId
        }
      }
    });

    if (!activation) {
      return NextResponse.json({ success: false, error: '激活码无效或不适用于该测试' });
    }

    if (activation.isDisabled) {
      return NextResponse.json({ success: false, error: '该激活码已被禁用' });
    }

    // VIP Loophole Fix: Bind to first resultKey used
    let boundKey = activation.boundResultKey;
    if (!boundKey && resultKey) {
      boundKey = resultKey;
      // We will save this binding later when saving the device
    } else if (boundKey && resultKey && boundKey !== resultKey) {
      return NextResponse.json({ success: false, error: '该激活码已绑定其他测试结果，请购买新码' });
    }



    let devices: string[] = [];
    try {
      devices = JSON.parse(activation.devices || '[]');
    } catch(e) {}

    const maxUses = activation.maxUses || 5; // Ticket 03: Increase default max uses to 5 for leniency
    const currentDevice = deviceId || 'unknown';

    let resultData = null;
    if (testId === 'destiny-lover' && resultKey) {
      const match = destinyLoverResults.find(r => r.key === resultKey) || destinyLoverResults[0];
      let finalDesc = match.description.replace(/{name}/g, nickname);
      if (status === 'dating') {
        finalDesc = finalDesc.replace(/你的命定恋人/g, '你现在的另一半(如果是命定的话)');
      }
      resultData = {
        description: finalDesc,
        quote: match.quote,
        radar: match.radar
      };
    }

    if (devices.includes(currentDevice)) {
      return NextResponse.json({ success: true, message: '已验证', result: resultData });
    }

    if (devices.length >= maxUses) {
      return NextResponse.json({ success: false, error: '该激活码已达到使用上限' });
    }
    
    devices.push(currentDevice);
    
    await prisma.activationCode.update({
      where: { id: activation.id },
      data: {
        devices: JSON.stringify(devices),
        ...(boundKey && { boundResultKey: boundKey })
      }
    });

    return NextResponse.json({ success: true, message: '验证通过', result: resultData });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, error: '验证失败' }, { status: 500 });
  }
}
