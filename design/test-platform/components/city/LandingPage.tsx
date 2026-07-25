'use client';

import { motion } from 'framer-motion';
import { Compass, Sparkles, Map } from 'lucide-react';
import { useQuizStore } from '@/lib/city/store/useQuizStore';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const startQuiz = useQuizStore((state) => state.startQuiz);
  const { setAnswers, setCurrentStep } = useQuizStore();
  const [onlineCount, setOnlineCount] = useState(1408);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);

  useEffect(() => {
    setOnlineCount(1400 + Math.floor(Math.random() * 500));
    try {
      const saved = JSON.parse(localStorage.getItem('quiz_history_city') || '[]');
      setHistoryRecords(saved);
    } catch (e) {}
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

        <div className="flex flex-col items-center gap-2 mt-6">
          <div className="flex items-center justify-center gap-8 font-mono font-bold">
            <button onClick={() => setShowHistory(true)} className="text-xs text-gray-400 hover:text-[#1a1a1a] transition-colors underline underline-offset-4">[ 查看历史记录 ]</button>
            <a href="/" className="text-xs text-gray-400 hover:text-[#1a1a1a] transition-colors underline underline-offset-4">[ 探索测试大厅 ]</a>
          </div>
        </div>
      </div>

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
                      // Move directly to result view which is step 20 (index 20) in this context,
                      // But wait, QuizInterface expects currentStep to control logic.
                      // The easiest way is to let useQuizStore go to ResultView if currentStep >= 20.
                      setCurrentStep(20);
                      setShowHistory(false);
                    }}
                    className="w-full text-left p-4 bg-white border border-[#d1cdc1] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all flex items-center justify-between mb-3 rounded"
                  >
                    <div>
                      <div className="text-xs text-gray-500 font-mono mb-1">TICKET {record.id}</div>
                      <div className="font-bold text-sm">性格城市匹配测试</div>
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
