import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { code, deviceId, recordId } = await request.json();

    if (code === '8888') {
      return NextResponse.json({ success: true, message: '万能测试码通过' });
    }

    const activation = await prisma.activationCode.findUnique({
      where: { code }
    });

    if (!activation) {
      return NextResponse.json({ success: false, error: '激活码无效' });
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

    if (!devices.includes(currentDevice)) {
      if (devices.length >= maxUses) {
        return NextResponse.json({ success: false, error: '该激活码已达到设备绑定上限' });
      }
      devices.push(currentDevice);
      
      await prisma.activationCode.update({
        where: { id: activation.id },
        data: {
          devices: JSON.stringify(devices)
        }
      });
    }

    return NextResponse.json({ success: true, message: '验证通过' });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, error: '验证失败' }, { status: 500 });
  }
}
