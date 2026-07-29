import { NextResponse } from 'next/server';
import { __reloadMockData } from '@/lib/tcb';

export async function POST() {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.TCB_SECRET_ID) {
      return NextResponse.json({ success: false, error: 'Cannot reload CSV in production mode' }, { status: 403 });
    }
    
    // Attempt to reload the mock data
    if (typeof __reloadMockData === 'function') {
      __reloadMockData();
      return NextResponse.json({ success: true, message: 'CSV reloaded successfully' });
    } else {
      return NextResponse.json({ success: false, error: 'Reload function not available' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Reload CSV error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
