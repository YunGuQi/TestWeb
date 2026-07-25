import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const API_BASE = process.env.API_BASE_URL || 'https://shared-backend-285344-10-1257349014.sh.run.tcloudbase.com';
    
    const res = await fetch(`${API_BASE}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      console.error('Backend returned status:', res.status);
    }
    
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      const text = await res.text();
      console.error('Backend returned non-JSON:', text.substring(0, 200));
      return NextResponse.json(
        { success: false, error: '大盘服务暂时不可用或返回格式错误' },
        { status: 200 } // 返回200让前端正常弹窗提示错误，不要抛出 fetch error
      );
    }
  } catch (error) {
    console.error('Verify order API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
