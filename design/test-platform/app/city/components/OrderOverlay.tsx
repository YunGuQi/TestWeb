'use client';

import { useState } from 'react';
import { verifyOrderCode } from '../lib/services/api';
import { useQuizStore } from '../lib/store/useQuizStore';

interface OrderOverlayProps {
  testId: string;
  onSuccess: () => void;
}

export default function OrderOverlay({ testId, onSuccess }: OrderOverlayProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { deviceId } = useQuizStore();
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async () => {
    setErrorMsg('');
    if (!code.trim()) {
      setErrorMsg('请输入有效的激活码');
      return;
    }
    
    setLoading(true);
    let did = deviceId;
    if (!did && typeof window !== 'undefined') {
      did = localStorage.getItem('deviceId_city') || localStorage.getItem('deviceId') || crypto.randomUUID();
      if (!deviceId) {
        useQuizStore.getState().setDeviceId(did);
      }
    }
    try {
      const data = await verifyOrderCode(code.trim(), did || 'unknown', testId);
      setLoading(false);
      
      if (data.success) {
        localStorage.setItem(`${testId}_unlocked`, 'true');
        setShowModal(false);
        onSuccess();
      } else {
        setErrorMsg(data.error || '该激活码无效或已被使用。');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('网络请求失败或服务器异常: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#fdfbf7]/60 backdrop-blur-[8px] p-6 text-center">
        <div className="font-mono text-xs text-red-600 font-bold mb-2 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
          [ CONDUCTOR CHECKPOINT ]
        </div>
        <button 
          id="btn-show-unlock" 
          onClick={() => setShowModal(true)} 
          className="bg-[#1a1a1a] text-[#fdfbf7] px-8 py-4 font-bold border-2 border-[#1a1a1a] shadow-[0_8px_25px_rgba(0,0,0,0.2)] hover:bg-black active:scale-95 transition-all rounded-md tracking-wider flex items-center gap-2"
        >
          <span>【列车长验票】解锁你的专属单程通行证 &rarr;</span>
        </button>
        <p className="text-xs font-mono text-gray-700 mt-3 font-medium">
          * 你的灵魂归属城市档案已生成，待列车长查验放行
        </p>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans">
          <div className="bg-[#fdfbf7] border-4 border-[#1a1a1a] w-full max-w-sm p-7 relative shadow-[10px_10px_0px_#000] rounded-lg">
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-4 right-4 text-black hover:scale-110 active:scale-95 transition-transform font-bold border-2 border-black w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm"
            >
              X
            </button>

            <div className="font-mono text-[10px] text-red-600 uppercase tracking-widest mb-1 font-bold">
              [ PASSENGER VERIFICATION ]
            </div>
            <h3 className="text-xl font-black mb-3 tracking-wider text-[#1a1a1a] flex items-center gap-2">
              <span>列车长查验·激活车票</span>
            </h3>

            <div className="w-full border-t border-dashed border-black/20 my-3"></div>

            <p className="text-xs sm:text-sm text-gray-700 mb-6 leading-relaxed text-justify font-medium">
              为维持【心灵逃跑车票】独家路线运算与高并发列车服务运作，请配合出示你在小红书获取的专属单程激活码。
            </p>

            <div className="relative mb-3">
              <input 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                type="text" 
                placeholder="请输入你的专属列车激活码..." 
                className="w-full border-2 border-[#1a1a1a] p-3.5 outline-none focus:bg-yellow-50/80 font-mono font-bold bg-white text-black placeholder-gray-400 rounded transition-colors text-sm shadow-inner" 
              />
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 font-bold text-xs p-2.5 rounded mb-4 flex items-center gap-1.5">
                <span>[!]</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <button 
              onClick={handleVerify} 
              disabled={loading} 
              className="w-full bg-[#1a1a1a] text-[#fdfbf7] font-bold p-4 border-2 border-[#1a1a1a] active:scale-[0.98] transition-all disabled:opacity-50 rounded shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:bg-black tracking-widest text-sm"
            >
              {loading ? '列车长核验数据中...' : '出示车票 / 立即检票通过 [CHECK-IN]'}
            </button>

            <div className="mt-4 text-center">
              <span className="font-mono text-[10px] text-gray-400">CONDUCTOR SYSTEM v2.4 - SOUL EXPRESS</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
