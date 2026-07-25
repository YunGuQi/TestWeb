'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, Sparkles, MapPin } from 'lucide-react';
import { useQuizStore } from '@/lib/city/store/useQuizStore';
import OrderOverlay from './OrderOverlay';
import { toPng } from 'html-to-image';

export default function ResultView() {
  const { answers, deviceId, reset } = useQuizStore();
  const [resultData, setResultData] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if unlocked
    const unlocked = localStorage.getItem(`city-personality_unlocked`) === 'true';
    setIsUnlocked(unlocked);

    async function fetchResult() {
      try {
        let did = deviceId;
        if (!did) {
          did = crypto.randomUUID();
          useQuizStore.getState().setDeviceId(did);
        }
        
        const res = await fetch('/api/city/submit-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers, deviceId: did })
        });
        const json = await res.json();
        if (json.success) {
          setResultData(json.data);
          
          // Save to history
          try {
            const history = JSON.parse(localStorage.getItem('quiz_history_city') || '[]');
            const newId = Date.now().toString().slice(-6);
            history.push({ id: newId, answers, timestamp: Date.now() });
            localStorage.setItem('quiz_history_city', JSON.stringify(history));
          } catch (e) {}
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchResult();
  }, [answers, deviceId]);

  if (!resultData) return <div className="min-h-screen flex items-center justify-center">正在生成你的专属车票...</div>;

  const { city, rank, userCoords } = resultData;

  const handleSave = async () => {
    if (!isUnlocked) {
      document.getElementById('btn-show-unlock')?.click();
      return;
    }

    if (!ticketRef.current) return;
    try {
      const dataUrl = await toPng(ticketRef.current, { cacheBust: true, style: { transform: 'scale(1)' } });
      const link = document.createElement('a');
      link.download = 'my-city-ticket.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to save image', err);
      alert('保存失败，请截图保存');
    }
  };

  return (
    <section className="page-section max-w-md mx-auto py-8 min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full flex justify-between items-center mb-4 px-2 select-none">
        <button className="text-gray-400 hover:text-black font-bold p-2 text-xl active:scale-90 transition-transform">&lsaquo;</button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-400 font-mono mb-1 tracking-widest uppercase">左右滑动切换设计风格</span>
          <span className="text-sm font-bold tracking-widest text-gray-800">默认风格</span>
        </div>
        <button className="text-gray-400 hover:text-black font-bold p-2 text-xl active:scale-90 transition-transform">&rsaquo;</button>
      </div>

      <div ref={ticketRef} className="relative bg-[#fdfbf7] text-[#1a1a1a] w-[85%] max-w-[320px] mx-auto flex flex-col overflow-hidden pb-6 rounded shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-[#d1cdc1]">
        
        {!isUnlocked && <OrderOverlay testId="city-personality" onSuccess={() => setIsUnlocked(true)} />}

        {/* Top Section */}
        <div className="p-6 relative mt-4">
          <div className="text-center font-mono text-xs font-bold opacity-60 absolute -top-2 left-0 w-full tracking-widest">
            {'> 你是本次列车第 '}<span>{rank}</span>{' 位乘车的旅客 <'}
          </div>
          
          <div className="absolute top-[35px] right-[20px] border-4 border-red-600 text-red-600 rounded-full w-20 h-20 flex items-center justify-center font-bold text-sm -rotate-12 opacity-80 text-center leading-tight">
            灵魂<br/>归属
          </div>

          <div className="flex justify-between items-start mb-6 mt-4">
            <div>
              <div className="font-mono text-xs opacity-70 mb-1">TRAIN NO.</div>
              <div className="font-bold text-lg">M-2024</div>
            </div>
            <div className="text-right pr-20">
              <div className="font-mono text-xs opacity-70 mb-1">CLASS</div>
              <div className="font-bold text-lg">SOUL</div>
            </div>
          </div>

          <div className="font-mono text-xs opacity-70 mb-1">DESTINATION</div>
          <div className="flex items-end gap-3 mb-2">
            <h2 className="text-5xl font-black tracking-tighter">{city.name}</h2>
            <span className="text-lg font-bold opacity-50 mb-1">{city.title}</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {city.tags.map((tag: string, i: number) => (
              <span key={i} className="bg-[#1a1a1a] text-[#fdfbf7] text-xs px-2 py-1 font-bold">{tag}</span>
            ))}
          </div>
        </div>

        <div className="border-t-2 border-dashed border-[#b5b1a3] mx-4 my-2"></div>

        {/* Middle Section */}
        <div className="p-6 pb-2">
          <div className="font-mono text-xs opacity-70 mb-3">5D SOUL SPECTRUM</div>
          <div className="mb-6 flex flex-col gap-2">
            {/* simple radar bar representation */}
            <div className="flex gap-2 text-[10px] items-center"><span className="w-10">节奏</span><div className="h-2 bg-black flex-1"><div style={{width: `${(userCoords[0]/10)*100}%`}} className="h-full bg-white opacity-50"></div></div></div>
            <div className="flex gap-2 text-[10px] items-center"><span className="w-10">环境</span><div className="h-2 bg-black flex-1"><div style={{width: `${(userCoords[1]/10)*100}%`}} className="h-full bg-white opacity-50"></div></div></div>
          </div>

          <div className="font-mono text-xs opacity-70 mb-3">DIAGNOSTIC REPORT</div>
          
          <div className="mb-4">
            <div className="font-bold text-xs mb-1 bg-black/10 inline-block px-2 py-0.5 rounded font-mono">【灵魂基调】</div>
            <p className="text-[13px] leading-relaxed font-medium text-justify">{city.desc}</p>
          </div>
          
          <div className="mt-5 p-4 bg-black/5 border-l-4 border-black italic font-bold text-sm">
            “{city.quote}”
          </div>
        </div>

        {/* Bottom Section */}
        <div className="px-6 flex flex-col items-center mt-6">
          <div className="font-mono text-[32px] tracking-[-2px] opacity-80 select-none">
            || | ||| || || | | || | |
          </div>
          <div className="font-mono text-[10px] opacity-50 mt-1 mb-2">NO. 8492039485721</div>
          <div className="font-mono text-[9px] opacity-40 text-center tracking-widest mt-1 border-t border-black pt-2 w-full">
            * 本档案结果仅供娱乐参考，请凭直觉执行
          </div>
        </div>
      </div>

      <div className="w-full mt-8 flex flex-col gap-4 pb-8">
        <button onClick={handleSave} className="w-full bg-[#1a1a1a] text-white py-4 rounded font-bold tracking-widest hover:bg-black active:scale-[0.98] transition-transform shadow-lg">
          长按保存专属车票
        </button>

        <div className="flex justify-center gap-6 mt-1 mb-2 font-mono font-bold w-full">
          <button onClick={() => { reset(); window.location.reload(); }} className="text-xs text-gray-400 hover:text-[#1a1a1a] transition-colors tracking-widest underline underline-offset-4">
            [ 重新购买车票 ]
          </button>
          
          <a href="/" className="text-xs text-gray-400 hover:text-[#1a1a1a] transition-colors underline underline-offset-4 tracking-widest">
            [ 探索测试大厅 ]
          </a>
        </div>
      </div>
    </section>
  );
}
