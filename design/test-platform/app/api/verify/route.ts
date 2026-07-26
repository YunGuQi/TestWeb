import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { code, deviceId, recordId } = await request.json();

    // Find code strictly scoped to this test
    const activation = await prisma.activationCode.findUnique({
      where: {
        code_testId: {
          code: code,
          testId: recordId
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

    if (devices.includes(currentDevice)) {
      return NextResponse.json({ success: true, message: '已验证' });
    }

    if (devices.length >= maxUses) {
      return NextResponse.json({ success: false, error: '该激活码已达到使用上限' });
    }
    
    devices.push(currentDevice);
    
    await prisma.activationCode.update({
      where: { id: activation.id },
      data: {
        devices: JSON.stringify(devices)
      }
    });

    return NextResponse.json({ success: true, message: '验证通过' });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, error: '验证失败' }, { status: 500 });
  }
}
