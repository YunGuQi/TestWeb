'use client';

import { useState } from 'react';
import { verifyOrderCode } from '../services-city/api';
import { useQuizStore } from '../store-city/useQuizStore';

interface OrderOverlayProps {
  testId: string;
  onSuccess: () => void;
}

export default function OrderOverlay({ testId, onSuccess }: OrderOverlayProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { deviceId } = useQuizStore();

  const handleVerify = async () => {
    if (!code.trim()) {
      alert('请输入订单编号');
      return;
    }
    
    setLoading(true);
    const res = await verifyOrderCode(code.trim(), deviceId || '', testId);
    setLoading(false);
    
    if (res.success || code.trim() === '66666') {
      localStorage.setItem(`${testId}_unlocked`, 'true');
      alert('验证成功！为您解锁完整测试解析。');
      onSuccess();
    } else {
      alert(res.error || '该激活码无效或已被使用。');
    }
  };

  return (
    <div className="absolute top-[280px] left-0 w-full h-[calc(100%-280px)] bg-gradient-to-b from-white/10 via-white/95 to-white backdrop-blur-md z-20 flex flex-col items-center pt-16">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-4/5 text-center border border-gray-200 relative overflow-hidden">
        <h3 className="text-lg font-bold text-gray-800 mb-2">解锁完整旅行指南</h3>
        <p className="text-xs text-gray-500 mb-4">请在小红书下单后，输入订单编号获取详细解析与五维灵魂图谱。</p>
        
        <input 
          type="text" 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded mb-4 text-center text-sm outline-none focus:border-black" 
          placeholder="输入订单号 (如 XHS 开头)" 
        />
        
        <button 
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-[#1a1a1a] text-white py-3 rounded font-bold tracking-widest text-sm hover:bg-black disabled:opacity-50"
        >
          {loading ? '验证中...' : '立即解锁'}
        </button>
        <p className="text-[10px] text-gray-400 mt-3">测试万能码: 66666</p>
      </div>
    </div>
  );
}
