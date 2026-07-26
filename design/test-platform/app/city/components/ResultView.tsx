'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, Sparkles, MapPin } from 'lucide-react';
import { useQuizStore } from '../lib/store/useQuizStore';
import { useRouter } from 'next/navigation';
import OrderOverlay from './OrderOverlay';
import { toPng } from 'html-to-image';

const ticketStyles = [
  {
    name: '默认风格',
    sub: '复古列车档案',
    bg: 'bg-[#fdfbf7]',
    text: 'text-[#1a1a1a]',
    border: 'border-[#d1cdc1]',
    divider: 'border-[#b5b1a3]',
    stampBorder: 'border-red-600 text-red-600',
    tagBg: 'bg-[#1a1a1a] text-[#fdfbf7]',
    barFill: 'bg-[#1a1a1a]',
    barTrack: 'bg-[#e4dfd4] border-[#1a1a1a]/15',
    quoteBg: 'bg-black/5 border-black',
    labelBg: 'bg-black/10 text-black',
    btnBg: 'bg-[#1a1a1a] text-white hover:bg-black',
    taglineColor: 'border-black'
  },
  {
    name: '暗夜赛博',
    sub: '黑客夜行凭证',
    bg: 'bg-[#121212]',
    text: 'text-[#f0f0f0]',
    border: 'border-[#333333]',
    divider: 'border-[#333333]',
    stampBorder: 'border-[#00FF66] text-[#00FF66] bg-[#00FF66]/10',
    tagBg: 'bg-[#00FF66] text-[#121212]',
    barFill: 'bg-[#00FF66]',
    barTrack: 'bg-[#262626] border-[#00FF66]/30',
    quoteBg: 'bg-[#00FF66]/10 border-[#00FF66] text-[#00FF66]',
    labelBg: 'bg-[#00FF66]/20 text-[#00FF66]',
    btnBg: 'bg-[#00FF66] text-black hover:bg-[#00e65c]',
    taglineColor: 'border-[#333333]'
  },
  {
    name: '日落报刊',
    sub: '复古波普剪报',
    bg: 'bg-[#FFF8EE]',
    text: 'text-[#2C1810]',
    border: 'border-[#E0533C]',
    divider: 'border-[#E0533C]/40',
    stampBorder: 'border-[#E0533C] text-[#E0533C] bg-[#E0533C]/10',
    tagBg: 'bg-[#E0533C] text-[#FFF8EE]',
    barFill: 'bg-[#E0533C]',
    barTrack: 'bg-[#EEDDCD] border-[#E0533C]/20',
    quoteBg: 'bg-[#E0533C]/10 border-[#E0533C]',
    labelBg: 'bg-[#E0533C]/15 text-[#E0533C]',
    btnBg: 'bg-[#E0533C] text-white hover:bg-[#c94630]',
    taglineColor: 'border-[#E0533C]/30'
  },
  {
    name: '极简冷淡',
    sub: '冷感工业票根',
    bg: 'bg-white',
    text: 'text-black',
    border: 'border-black',
    divider: 'border-black',
    stampBorder: 'border-black text-black bg-black/5',
    tagBg: 'bg-black text-white',
    barFill: 'bg-black',
    barTrack: 'bg-gray-200 border-black/10',
    quoteBg: 'bg-white border-black text-black',
    labelBg: 'bg-black text-white',
    btnBg: 'bg-black text-white hover:bg-gray-800',
    taglineColor: 'border-black/20'
  },
  {
    name: '千禧霓虹',
    sub: 'Y2K数字凭证',
    bg: 'bg-[#0B0C10]',
    text: 'text-[#45A29E]',
    border: 'border-[#66FCF1]',
    divider: 'border-[#45A29E]/50',
    stampBorder: 'border-[#66FCF1] text-[#66FCF1] bg-[#66FCF1]/10',
    tagBg: 'bg-[#45A29E] text-[#0B0C10]',
    barFill: 'bg-[#66FCF1]',
    barTrack: 'bg-[#1F2833] border-[#66FCF1]/20',
    quoteBg: 'bg-[#1F2833] border-[#45A29E] text-[#66FCF1]',
    labelBg: 'bg-[#66FCF1]/10 text-[#66FCF1]',
    btnBg: 'bg-[#66FCF1] text-[#0B0C10] hover:bg-[#45A29E]',
    taglineColor: 'border-[#45A29E]/30'
  }
];

interface ResultViewProps {
  forcedResultData?: any;
}

export default function ResultView({ forcedResultData }: ResultViewProps) {
  const router = useRouter();
  const { answers, deviceId, reset } = useQuizStore();
  const [resultData, setResultData] = useState<any>(forcedResultData || null);
  const [isUnlocked, setIsUnlocked] = useState(!!forcedResultData);
  const [styleIdx, setStyleIdx] = useState(0);
  const currentStyle = ticketStyles[styleIdx];
  const touchStartX = useRef(0);
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 50) {
      setStyleIdx((prev) => (prev - 1 + ticketStyles.length) % ticketStyles.length);
    } else if (diff < -50) {
      setStyleIdx((prev) => (prev + 1) % ticketStyles.length);
    }
  };

  useEffect(() => {
    // Check if unlocked
    const unlocked = localStorage.getItem(`city-personality_unlocked`) === 'true';
    setIsUnlocked(unlocked);

    async function fetchResult() {
      if (forcedResultData) return;
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
    if (!forcedResultData) {
      fetchResult();
    }
  }, [answers, deviceId, forcedResultData]);

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
    <section className="page-section w-full max-w-md mx-auto py-8 min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full flex justify-between items-center mb-4 px-2 select-none">
        <button onClick={() => setStyleIdx((prev) => (prev - 1 + ticketStyles.length) % ticketStyles.length)} className="text-gray-400 hover:text-black font-bold p-2 text-xl active:scale-90 transition-transform cursor-pointer">&lsaquo;</button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-400 font-mono mb-0.5 tracking-widest uppercase">左右滑动或点击切换设计风格 ({styleIdx + 1}/{ticketStyles.length})</span>
          <span className="text-sm font-bold tracking-widest text-gray-800">{currentStyle.name} <span className="text-[11px] font-normal text-gray-400">({currentStyle.sub})</span></span>
        </div>
        <button onClick={() => setStyleIdx((prev) => (prev + 1) % ticketStyles.length)} className="text-gray-400 hover:text-black font-bold p-2 text-xl active:scale-90 transition-transform cursor-pointer">&rsaquo;</button>
      </div>

      <div 
        ref={ticketRef}
        id="ticket-capture"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative ${currentStyle.bg} ${currentStyle.text} w-full flex flex-col overflow-hidden pb-6 rounded shadow-[0_10px_40px_rgba(0,0,0,0.06)] border ${currentStyle.border} transition-colors duration-300`}
      >
        
        {!isUnlocked && <OrderOverlay testId="city-personality" onSuccess={() => setIsUnlocked(true)} />}

        {/* Top Section */}
        <div className="p-6 relative mt-4">
          <div className="text-center font-mono text-xs font-bold opacity-60 absolute -top-2 left-0 w-full tracking-widest">
            {'> 你是本次列车第 '}<span>{rank}</span>{' 位乘车的旅客 <'}
          </div>
          
          <div className={`absolute top-[35px] right-[20px] border-4 ${currentStyle.stampBorder} rounded-full w-20 h-20 flex items-center justify-center font-bold text-sm -rotate-12 opacity-80 text-center leading-tight transition-colors duration-300`}>
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
          <div className="flex items-end gap-3 mb-2 flex-wrap">
            <h2 className="text-5xl font-black tracking-tighter whitespace-nowrap">{city.name}</h2>
            <span className="text-lg font-bold opacity-50 mb-1">{city.title}</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {city.tags.map((tag: string, i: number) => (
              <span key={i} className={`${currentStyle.tagBg} text-xs px-2.5 py-1 font-bold rounded-sm transition-colors duration-300`}>{tag}</span>
            ))}
          </div>
        </div>

        <div className={`border-t-2 border-dashed ${currentStyle.divider} mx-4 my-2 transition-colors duration-300`}></div>

        {/* Middle Section */}
        <div className="p-6 pb-2">
          <div className="font-mono text-xs opacity-70 mb-3">5D SOUL SPECTRUM</div>
          <div className="mb-6 flex flex-col gap-2.5">
            {[
              { label: '节奏', value: userCoords[0] ?? 5 },
              { label: '环境', value: userCoords[1] ?? 5 },
              { label: '温度', value: userCoords[2] ?? 5 },
              { label: '社交', value: userCoords[3] ?? 5 },
              { label: '品味', value: userCoords[4] ?? 5 }
            ].map((dim, i) => {
              let pct = (dim.value / 10) * 100;
              if (pct < 10) pct = 10;
              if (pct > 99) pct = 99;
              const hash = ((dim.value * 13.5 + rank * 7.3 + i * 3.1) % 1) * 0.99;
              const pctStr = (Math.floor(pct) + hash).toFixed(2) + '%';
              return (
                <div key={i} className="flex gap-2.5 text-xs items-center">
                  <span className="w-8 font-bold opacity-90 shrink-0">{dim.label}</span>
                  <div className={`h-2.5 ${currentStyle.barTrack} flex-1 rounded-full overflow-hidden border shadow-inner transition-colors duration-300`}>
                    <div style={{ width: pctStr }} className={`h-full ${currentStyle.barFill} rounded-full transition-all duration-500`}></div>
                  </div>
                  <span className="w-12 text-right font-mono font-bold text-xs shrink-0">{pctStr}</span>
                </div>
              );
            })}
          </div>

          <div className="font-mono text-xs opacity-70 mb-3">DIAGNOSTIC REPORT</div>
          
          <div className="mb-4">
            <div className={`font-bold text-xs mb-1 ${currentStyle.labelBg} inline-block px-2 py-0.5 rounded font-mono transition-colors duration-300`}>【灵魂基调】</div>
            <p className="text-[13px] leading-relaxed font-medium text-justify">{city.desc}</p>
          </div>
          
          <div className={`mt-5 p-4 ${currentStyle.quoteBg} border-l-4 italic font-bold text-sm transition-colors duration-300`}>
            “{city.quote}”
          </div>
        </div>

        {/* Bottom Section */}
        <div className="px-6 flex flex-col items-center mt-6">
          <div className="flex items-center justify-center gap-[2.5px] h-8 opacity-80 overflow-hidden w-full max-w-[240px] my-1 select-none">
            {[2, 1, 3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 4, 1, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 4, 1, 2, 1].map((w, idx) => (
              <div
                key={idx}
                style={{ width: `${w}px` }}
                className={`h-full ${currentStyle.barFill} shrink-0`}
              />
            ))}
          </div>
          <div className="font-mono text-[10px] opacity-50 mt-1 mb-2">NO. 8492039485721</div>
          <div className={`font-mono text-[9px] opacity-40 text-center tracking-widest mt-1 border-t ${currentStyle.taglineColor} pt-2 w-full`}>
            * 本档案结果仅供娱乐参考，请凭直觉执行
          </div>
        </div>
      </div>

      <div className="w-full mt-8 flex flex-col gap-4 pb-8">
        <button onClick={handleSave} className={`w-full ${currentStyle.btnBg} py-4 rounded font-bold tracking-widest active:scale-[0.98] transition-all duration-300 shadow-lg`}>
          长按保存专属车票
        </button>

        <div className="flex justify-center gap-6 mt-1 mb-2 font-mono font-bold w-full">
          <button onClick={() => { reset(); router.push('/city'); }} className="text-xs text-gray-400 hover:text-[#1a1a1a] transition-colors tracking-widest underline underline-offset-4">
            [ 重新购买车票 ]
          </button>
          
          <button onClick={() => router.push('/')} className="text-xs text-gray-400 hover:text-[#1a1a1a] transition-colors underline underline-offset-4 tracking-widest">
            [ 探索测试大厅 ]
          </button>
        </div>
      </div>
    </section>
  );
}
