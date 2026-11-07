import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { CITY_RESULTS_FALLBACK } from '../../../../lib/city-fallback';

export async function POST(request: Request) {
  try {
    const { code, deviceId, recordId = 'city-personality', cityName, cityId } = await request.json();
    const testId = recordId || 'city-personality';

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: '请输入有效的激活码' }, { status: 400 });
    }

    const trimmedCode = code.trim();

    // Find code strictly scoped to this test
    const activation = await prisma.activationCode.findUnique({
      where: {
        code_testId: {
          code: trimmedCode,
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

    let devices: string[] = [];
    try {
      devices = JSON.parse(activation.devices || '[]');
    } catch(e) {}

    const maxUses = activation.maxUses || 3;
    const currentDevice = deviceId || 'unknown';
    const isMasterCode = trimmedCode === 'CODE-JIE';

    if (!devices.includes(currentDevice)) {
      if (!isMasterCode && devices.length >= maxUses) {
        return NextResponse.json({ success: false, error: `该卡密已达到最大设备分享上限（最多支持 ${maxUses} 台设备）` });
      }
      
      devices.push(currentDevice);
      
      await prisma.activationCode.update({
        where: { id: activation.id },
        data: {
          devices: JSON.stringify(devices)
        }
      });
    }

    // 从权威静态库根据 cityName 或 cityId 提取深度生活切片
    const match = CITY_RESULTS_FALLBACK.find(fb => {
      try {
        const cond = JSON.parse(fb.condition);
        return (cityName && (cond.name === cityName || fb.title.includes(cityName))) || 
               (cityId && (String(fb.id) === String(cityId)));
      } catch (e) {
        return false;
      }
    }) || CITY_RESULTS_FALLBACK[0];

    let extra: any = {};
    try {
      extra = JSON.parse(match.condition);
    } catch (e) {}

    const unlockedData = {
      schedule: extra.schedule || {
        morning: "清晨迎着第一缕日光漫步放空",
        afternoon: "午后找个安静角落喝茶阅读",
        night: "深夜在微风中卸下一天的疲惫"
      },
      curePrescription: extra.curePrescription || {
        dazePlace: "城市街角的老公园长椅",
        soulFood: "一碗热气腾腾的家乡面",
        spiritBuddy: "懂你欲言又止的同频好友"
      },
      toxicCity: extra.toxicCity || {
        name: "高压内卷之城",
        reason: "节奏过于窒息会让你瞬间精神透支。"
      }
    };

    return NextResponse.json({ 
      success: true, 
      message: '验证通过',
      unlockedData 
    });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, error: '验证失败' }, { status: 500 });
  }
}
