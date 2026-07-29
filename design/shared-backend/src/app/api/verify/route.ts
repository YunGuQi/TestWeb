import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';

// Helper for CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, deviceId, testId } = body;

    if (!code || !deviceId) {
      return NextResponse.json({ error: '缺少必需的参数' }, { status: 400, headers: corsHeaders });
    }

    // Find the activation code
    const codeRes = await db.collection('ActivationCode').where({ code }).get();
    
    if (!codeRes.data || codeRes.data.length === 0) {
      return NextResponse.json({ error: '无效的激活码' }, { status: 404, headers: corsHeaders });
    }
    
    const activation = codeRes.data[0];

    if (activation.isDisabled) {
      return NextResponse.json({ error: '该激活码已被禁用，无法使用' }, { status: 403, headers: corsHeaders });
    }

    // Check if the code is applicable to this test
    if (activation.testId && activation.testId !== testId) {
      return NextResponse.json({ error: '该激活码无法用于此项测试' }, { status: 400, headers: corsHeaders });
    }

    const devices = activation.devices || [];
    const deviceIndex = devices.findIndex((d: any) => d.deviceId === deviceId);
    
    if (deviceIndex > -1) {
      // Update usage stats
      devices[deviceIndex].useCount = (devices[deviceIndex].useCount || 1) + 1;
      devices[deviceIndex].lastUsedAt = new Date().toISOString();
      
      await db.collection('ActivationCode').doc(activation._id).update({
        devices: devices
      });
      return NextResponse.json({ success: true, message: '欢迎回来，已自动登录' }, { status: 200, headers: corsHeaders });
    }

    // Device not bound yet, check if max uses reached
    const maxUses = activation.maxUses || 3;
    if (devices.length >= maxUses) {
      return NextResponse.json({ error: `该激活码绑定的设备数量已达到 ${maxUses} 台上限` }, { status: 403, headers: corsHeaders });
    }

    // Bind new device
    devices.push({
      deviceId: deviceId,
      useCount: 1,
      lastUsedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    await db.collection('ActivationCode').doc(activation._id).update({
      devices: devices
    });

    return NextResponse.json({ success: true, message: '验证通过，设备绑定成功' }, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: '内部服务器错误' }, { status: 500, headers: corsHeaders });
  }
}
