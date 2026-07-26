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
      <div className="absolute top-[280px] left-0 w-full h-[calc(100%-280px)] bg-white/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
         <button id="btn-show-unlock" onClick={() => setShowModal(true)} className="bg-black text-white px-6 py-3 font-bold border-2 border-black shadow-[4px_4px_0px_#fff] hover:translate-y-1 hover:shadow-none transition-all">
            解锁后查看完整车票
         </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border-4 border-black w-full max-w-sm p-6 relative shadow-[8px_8px_0px_#000]">
                <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-black hover:scale-110 transition-transform font-bold border-2 border-black w-8 h-8 flex items-center justify-center bg-[#f4f4f4]">X</button>
                <h3 className="text-xl font-bold mb-4 tracking-wider text-black">验证激活码</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">感谢对原创心血的认可。为了维持优质的内容产出与服务器运作，本次测算结果请认准小红书唯一官方发布账号。</p>
                <input value={code} onChange={(e) => setCode(e.target.value)} type="text" placeholder="请输入你在小红书收到的激活码" className="w-full border-2 border-black p-3 mb-2 outline-none focus:bg-yellow-50 font-bold bg-white text-black placeholder-gray-400" />
                {errorMsg && <p className="text-red-600 font-bold text-xs mb-4">{errorMsg}</p>}
                <button onClick={handleVerify} disabled={loading} className="w-full bg-black text-white font-bold p-3 border-2 border-black active:translate-y-1 transition-transform disabled:opacity-50">
                   {loading ? '验证中...' : '提交验证'}
                </button>
            </div>
        </div>
      )}
    </>
  );
}
