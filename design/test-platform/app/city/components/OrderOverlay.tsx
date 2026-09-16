'use client';

import { useState } from 'react';
import { verifyOrderCode } from '../lib/services/api';
import { useQuizStore } from '../lib/store/useQuizStore';

interface OrderOverlayProps {
  testId?: string;
  cityName?: string;
  cityId?: any;
  onSuccess: (unlockedData?: any) => void;
}

export default function OrderOverlay({ testId = 'city-personality', cityName, cityId, onSuccess }: OrderOverlayProps) {
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
      const data = await verifyOrderCode(code.trim(), did || 'unknown', testId, cityName, cityId);
      setLoading(false);
      
      if (data.success) {
        // 清理历史废弃脏缓存
        localStorage.removeItem('city-personality_unlocked');
        localStorage.removeItem('city-personality_unlocked_data');
        localStorage.removeItem('city-personality_saved_code');

        // 升级为全平台方案 A 标准（设备级永久解锁 + 多城市独立字典 profiles 缓存 + 卡密凭据持久化）
        let localProfiles: Record<string, any> = {};
        const cached = localStorage.getItem(`verified_${testId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.profiles && typeof parsed.profiles === 'object') {
              localProfiles = { ...parsed.profiles };
            }
          } catch(e) {}
        }
        if (cityName && data.unlockedData) {
          localProfiles[cityName] = data.unlockedData;
        }

        localStorage.setItem(`verified_${testId}`, JSON.stringify({
          unlocked: true,
          lastVerifiedCode: code.trim(),
          profiles: localProfiles,
          // 兼容保留旧版扁平字段
          cityName: cityName,
          cityId: cityId,
          data: data.unlockedData
        }));

        setShowModal(false);
        onSuccess(data.unlockedData);
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
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-[#fdfbf7]/60 via-[#fdfbf7]/95 to-[#fdfbf7] dark:from-[#0d0f0d]/60 dark:via-[#0d0f0d]/95 dark:to-[#0d0f0d] backdrop-blur-md p-6 text-center rounded-lg shadow-inner">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-4 tracking-wider shadow-sm">
          <span>🔒</span>
          <span>诊断报告与深度避难切片已封存 70%</span>
        </div>
        <div className="w-14 h-14 rounded-full bg-black/10 dark:bg-white/10 border-2 border-black/30 dark:border-white/30 flex items-center justify-center text-black dark:text-white mb-3 shadow-inner">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h4 className="font-black text-[#1a1a1a] dark:text-[#fdfbf7] text-sm sm:text-base tracking-wider mb-1.5 flex items-center justify-center gap-1.5 whitespace-nowrap">
          <span>🎫 专属车票深度避难指南已封存</span>
        </h4>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-5 max-w-[280px] font-medium">
          你的 24h 隐居日程、治愈处方、相克避雷毒舌预警已全部测算就绪，待检票放行。
        </p>
        <button 
          id="btn-show-unlock" 
          onClick={() => setShowModal(true)} 
          className="w-full max-w-[290px] bg-[#1a1a1a] text-[#fdfbf7] dark:bg-white dark:text-black py-3.5 px-3.5 rounded font-black text-xs sm:text-sm tracking-wider shadow-[0_8px_25px_rgba(0,0,0,0.25)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span>🔓 【列车长验票】立即检票解锁</span>
          <span className="text-xs sm:text-sm">➔</span>
        </button>
        <div className="mt-3 font-mono text-[10px] text-gray-500 font-bold whitespace-nowrap">
          小红书官方认证 · 一人一票专属单程通行证
        </div>
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
                maxLength={20}
                type="text" 
                placeholder="请输入你的专属列车激活码 (至多20字)..." 
                className="w-full border-2 border-[#1a1a1a] p-3.5 outline-none focus:bg-yellow-50/80 font-mono font-bold bg-white text-black placeholder-gray-400 rounded transition-colors text-sm shadow-inner truncate" 
              />
            </div>

            {errorMsg && (
              <div className="flex flex-col gap-2 mb-4">
                <div className="bg-red-50 border border-red-200 text-red-600 font-bold text-xs p-2.5 rounded flex items-center gap-1.5">
                  <span>[!]</span>
                  <span>{errorMsg}</span>
                </div>
                <button 
                  onClick={() => window.open('https://xhslink.com/m/Atwtf3Cy6FR', '_blank')} 
                  className="w-full bg-white text-red-600 font-bold p-2 text-xs border border-red-200 hover:bg-red-50 transition-all rounded"
                >
                  前往安安店铺
                </button>
              </div>
            )}

            <button 
              onClick={handleVerify} 
              disabled={loading} 
              className="w-full min-h-[44px] bg-[#1a1a1a] text-[#fdfbf7] font-bold py-3.5 px-3 border-2 border-[#1a1a1a] active:scale-[0.98] transition-all disabled:opacity-50 rounded shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:bg-black tracking-wider text-xs sm:text-sm touch-manipulation cursor-pointer flex items-center justify-center whitespace-nowrap"
            >
              {loading ? '列车长核验数据中...' : '立即检票通行 · [CHECK-IN]'}
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
