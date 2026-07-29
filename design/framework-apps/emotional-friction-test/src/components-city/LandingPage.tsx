'use client';

import { useQuizStore } from '../store-city/useQuizStore';
import { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const startQuiz = useQuizStore((state) => state.startQuiz);
  const [onlineCount, setOnlineCount] = useState(1408);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  const openHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('quiz_history_city') || '[]');
      setHistoryItems(history);
    } catch(e) {}
    setShowHistory(true);
  };

  useEffect(() => {
    setOnlineCount(1400 + Math.floor(Math.random() * 500));
  }, []);

  return (
    <section className="min-h-[100dvh] flex flex-col items-center justify-center p-8 max-w-md mx-auto">
      <div className="relative bg-[#fdfbf7] text-[#1a1a1a] w-full p-8 text-center flex flex-col items-center rounded shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-[#d1cdc1] before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:-left-4 before:w-8 before:h-8 before:bg-[#e6e4df] before:rounded-full before:shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] before:border before:border-[#d1cdc1] before:border-r-transparent before:border-t-transparent before:rotate-45 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-right-4 after:w-8 after:h-8 after:bg-[#e6e4df] after:rounded-full after:shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] after:border after:border-[#d1cdc1] after:border-l-transparent after:border-b-transparent after:rotate-45">
        <h1 className="text-4xl font-black tracking-tight mb-2">心灵逃跑车票</h1>
        <p className="font-mono text-sm opacity-70 mb-6 uppercase tracking-widest">ONE-WAY TICKET TO YOUR SOUL</p>

        <div className="text-left w-full bg-black/5 p-4 rounded text-sm text-gray-600 mb-8 font-mono leading-relaxed">
          {'> DESTINATION: UNKNOWN'}
          <br />
          {'> PASSENGER: YOU'}
          <br />
          {'> DEPARTURE: NOW'}
          <br />
          <br />
          回答20道极其真实的安检题，获取你的专属单程车票。寻找全国34个省份中最契合你灵魂的那座城。
        </div>

        <button
          onClick={startQuiz}
          className="w-full bg-[#1a1a1a] text-[#fdfbf7] py-4 rounded font-bold tracking-widest text-lg hover:bg-black active:scale-[0.98] transition-transform shadow-lg"
        >
          开始检票 [CHECK-IN]
        </button>

        <div className="mt-4 text-gray-500 px-4 py-1 rounded-full text-xs font-bold font-mono flex items-center justify-center">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
          目前有 {onlineCount.toLocaleString()} 人正在候车
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-4 w-full">
          <button onClick={openHistory} className="text-xs text-gray-400 hover:text-black transition-colors tracking-widest underline underline-offset-4 font-mono">
            查看历史车票
          </button>
          <a href="/" className="text-xs text-gray-400 hover:text-black transition-colors tracking-widest underline underline-offset-4 font-mono">
            探索其他专柜
          </a>
        </div>
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#f4f4f5] text-black border-t-4 border-black p-6 pb-[max(32px,env(safe-area-inset-bottom))] w-full max-w-lg mx-auto h-[60vh] flex flex-col relative animate-[slideUp_0.3s_ease-out]">
            <button 
              onClick={() => setShowHistory(false)}
              className="absolute top-4 right-4 w-10 h-10 border-2 border-black flex items-center justify-center font-bold active:translate-y-1 bg-white shadow-[2px_2px_0px_#000] active:shadow-none transition-all"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-black mb-6">历史车票记录</h2>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-6">
              {historyItems.length === 0 ? (
                <div className="text-gray-500 text-sm mt-4 italic font-bold">暂无车票记录。</div>
              ) : (
                historyItems.map((item, index) => (
                  <div key={item.id} className="block p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-gray-500 mb-1">CITY: {item.data?.city?.name || 'Unknown'}</div>
                      <div className="font-bold">灵魂归属车票</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button onClick={() => setShowHistory(false)} className="w-full bg-[#1a1a1a] text-white py-3 font-bold">
              关闭抽屉
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
