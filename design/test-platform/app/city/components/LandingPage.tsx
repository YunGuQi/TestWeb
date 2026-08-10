'use client';

import { motion } from 'framer-motion';
import { Compass, Sparkles, Map } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuizStore } from '../lib/store/useQuizStore';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const startQuiz = useQuizStore((state) => state.startQuiz);
  const { setAnswers, setCurrentStep } = useQuizStore();
  const [onlineCount, setOnlineCount] = useState(1408);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    setOnlineCount(Math.floor(Math.random() * 101) + 1380);
    const intervalId = setInterval(() => {
      setOnlineCount((prev) => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    
    try {
      const saved = JSON.parse(localStorage.getItem('quiz_history_city') || '[]');
      setHistoryRecords(saved);
    } catch (e) {}
    
    return () => clearInterval(intervalId);
  }, []);

  const handleCheckIn = () => {
    if (isCheckingIn) return;
    setIsCheckingIn(true);
    setTimeout(() => {
      startQuiz();
    }, 320);
  };

  return (
    <section className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 sm:p-8 max-w-md mx-auto">
      <motion.div 
        animate={isCheckingIn ? { scale: 0.95, y: -20, opacity: 0 } : { scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative bg-[#fdfbf7] text-[#1a1a1a] w-full p-8 text-center flex flex-col items-center rounded-lg shadow-[0_15px_50px_rgba(0,0,0,0.12)] border-2 border-[#d1cdc1] overflow-hidden before:content-[''] before:absolute before:top-[54%] before:-translate-y-1/2 before:-left-4 before:w-8 before:h-8 before:bg-[#1a1a1a] before:rounded-full before:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] before:border-2 before:border-[#d1cdc1] before:border-r-transparent before:border-t-transparent before:rotate-45 after:content-[''] after:absolute after:top-[54%] after:-translate-y-1/2 after:-right-4 after:w-8 after:h-8 after:bg-[#1a1a1a] after:rounded-full after:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] after:border-2 after:border-[#d1cdc1] after:border-l-transparent after:border-b-transparent after:rotate-45"
      >
        {/* 右上角老式防伪钢印 */}
        <div className="absolute top-4 right-4 border-4 border-red-600/80 text-red-600/90 rounded-full w-20 h-20 flex flex-col items-center justify-center font-black text-[10px] -rotate-12 select-none pointer-events-none shadow-sm bg-red-500/5 backdrop-blur-[1px] z-20">
          <span>安检合格</span>
          <span className="text-[13px] tracking-widest my-0.5">PASS</span>
          <span className="text-[8px] opacity-70 font-mono">SOUL-2024</span>
        </div>

        <div className="font-mono text-[10px] text-gray-400 uppercase tracking-[0.25em] mb-2 self-start">
          [ SOUL DEPARTURE TICKET ]
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2 text-[#1a1a1a]">心灵逃跑车票</h1>
        <p className="font-mono text-xs sm:text-sm text-gray-500 mb-5 uppercase tracking-[0.2em]">ONE-WAY TICKET TO YOUR SOUL</p>



        <div className="text-left w-full bg-black/[0.04] border border-black/10 p-4 rounded text-xs sm:text-sm text-gray-700 mb-6 font-mono leading-relaxed shadow-inner">
          <div className="flex justify-between border-b border-black/10 pb-2 mb-2 font-bold text-[#1a1a1a]">
            <span>CLASS: SINGLE-TRIP</span>
            <span>DATE: NOW</span>
          </div>
          {'> DESTINATION: UNKNOWN'}
          <br />
          {'> PASSENGER: YOU'}
          <br />
          {'> GATE: OPEN FOR CHECK-IN'}
          <br />
          <br />
          <p className="font-sans font-medium text-gray-600">
            回答20道极其真实的安检题，获取你的专属单程车票。寻找全国34个省份中最契合你灵魂的那座城。
          </p>
        </div>

        {/* 虚线分割带 */}
        <div className="w-full border-t-2 border-dashed border-[#b5b1a3]/60 my-2"></div>

        <button
          onClick={handleCheckIn}
          disabled={isCheckingIn}
          className="w-full mt-4 bg-[#1a1a1a] text-[#fdfbf7] py-4 rounded font-bold tracking-[0.2em] text-lg hover:bg-black active:scale-[0.98] transition-all duration-200 shadow-[0_8px_20px_rgba(0,0,0,0.25)] flex items-center justify-center gap-2"
        >
          <span>{isCheckingIn ? '正在检票打孔...' : '开始检票 [CHECK-IN]'}</span>
        </button>

        <div className="mt-4 text-gray-600 px-4 py-1 rounded-full text-xs font-bold font-mono flex items-center justify-center">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
          目前有 {onlineCount.toLocaleString()} 人正在候车
        </div>

        {/* 底部票据序列码 */}
        <div className="mt-6 w-full flex flex-col items-center border-t border-[#d1cdc1]/50 pt-4">
          <div className="flex items-center justify-center gap-[2px] h-5 opacity-40 overflow-hidden w-full max-w-[200px] mb-1 select-none">
            {[2, 1, 3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 4, 1, 2, 1, 3, 1, 2, 4].map((w, idx) => (
              <div key={idx} style={{ width: `${w}px` }} className="h-full bg-[#1a1a1a] shrink-0" />
            ))}
          </div>
          <span className="font-mono text-[9px] text-gray-400">SERIAL: CN-34-SOUL-EXPRESS</span>
        </div>

        <div className="flex items-center justify-center gap-2 font-mono font-bold mt-4 flex-wrap">
          <button onClick={() => setShowHistory(true)} className="text-xs text-gray-500 hover:text-[#1a1a1a] transition-colors underline underline-offset-4 min-h-[44px] inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 px-2 whitespace-nowrap">[ 查看历史记录 ]</button>
          <button 
            type="button"
            onClick={() => window.location.href = 'https://xhslink.com/m/Atwtf3Cy6FR'} 
            className="text-xs text-gray-500 hover:text-[#1a1a1a] transition-colors underline underline-offset-4 min-h-[44px] inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 px-2 whitespace-nowrap"
          >
            [ 访问黑市补给站 ]
          </button>
        </div>
      </motion.div>

      {showHistory && (
        <div className="fixed inset-0 z-50 bg-[#1a1a1a]/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#fdfbf7] text-[#1a1a1a] border-t border-[#d1cdc1] p-6 pb-[max(32px,env(safe-area-inset-bottom))] w-full max-w-lg mx-auto h-[60vh] flex flex-col relative rounded-t-xl">
            <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 w-10 h-10 border border-[#d1cdc1] flex items-center justify-center font-bold active:scale-95 transition-transform rounded bg-white">X</button>
            <h2 className="text-2xl font-black mb-6 tracking-widest">历史车票档案</h2>
            <div className="flex-1 overflow-y-auto pr-2 mb-6">
              {historyRecords.length === 0 ? (
                <div className="text-gray-500 text-sm mt-4 italic font-bold">暂无车票记录。</div>
              ) : (
                [...historyRecords].reverse().map((record, index) => (
                  <button 
                    key={record.id + index}
                    onClick={() => {
                      setAnswers(record.answers);
                      setCurrentStep(20);
                      useQuizStore.getState().setHasGenerated(true);
                      setShowHistory(false);
                    }}
                    className="w-full text-left p-4 bg-white border border-[#d1cdc1] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all flex items-center justify-between mb-3 rounded"
                  >
                    <div>
                      <div className="text-xs text-gray-500 font-mono mb-1">TICKET {record.id}</div>
                      <div className="font-bold text-sm">{record.result?.title || '性格城市匹配测试'}</div>
                    </div>
                    <div className="font-mono text-xs text-[#1a1a1a] px-2 py-1 font-bold">查看 &gt;</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
