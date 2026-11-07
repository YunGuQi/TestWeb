'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingViewProps {
  onStartTest: (nickname: string, status: 'single' | 'relationship') => void;
  onRestoreHistory: (recordResult: any) => void;
}

export default function LandingView({ onStartTest, onRestoreHistory }: LandingViewProps) {
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState<'single' | 'relationship'>('single');
  const [step, setStep] = useState<'intro' | 'form'>('intro');
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    setOnlineCount(Math.floor(Math.random() * 60) + 40);
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const change = Math.floor(Math.random() * 9) - 3; // -3 to +5 (trends slightly upwards)
        return Math.max(18, Math.min(320, prev + change));
      });
    }, 3800);

    try {
      const localStr = localStorage.getItem('quiz_history');
      if (localStr) {
        const localData = JSON.parse(localStr).filter((r: any) => r.testId === 'love-species');
        setHistoryRecords(localData);
      }
    } catch(e) {}

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      alert('请先填入您的代号 (昵称)');
      return;
    }
    if (!status) {
      alert('请选择档案标定状态');
      return;
    }
    onStartTest(nickname.trim(), status);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen px-6 py-12 relative bg-[#FFFDF0] text-[#5C4B40] overflow-hidden">
      {/* Background Floating Emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute top-[10%] left-[10%] text-3xl opacity-60"
        >
          ☁️
        </motion.div>
        <motion.div 
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] right-[15%] text-2xl opacity-60"
        >
          🌸
        </motion.div>
        <motion.div 
          animate={{ y: [0, -10, 0], x: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-[20%] left-[15%] text-4xl opacity-40"
        >
          🐾
        </motion.div>
        <motion.div 
          animate={{ y: [0, 15, 0], rotate: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-[30%] right-[10%] text-3xl opacity-50"
        >
          ✨
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key="intro"
          initial={{ opacity: 0, y: 30, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="z-10 w-full max-w-md bg-[#FDFBF7] p-8 pb-10 rounded-3xl border-2 border-[#FFD4DB] shadow-[0_8px_30px_rgba(255,212,219,0.5)] relative"
        >
          {/* Washi Tape Decorations */}
          <div className="absolute -top-3 -left-3 w-16 h-6 bg-[#E1EED3]/80 backdrop-blur-sm -rotate-12 transform shadow-sm border border-[#E1EED3] z-20" />
          <div className="absolute -bottom-4 -right-2 w-20 h-7 bg-[#FFD4DB]/80 backdrop-blur-sm rotate-6 transform shadow-sm border border-[#FFD4DB] z-20" />

          <div className="flex flex-col items-center mt-4 text-center">
            <div className="w-16 h-16 bg-[#FFFDF0] rounded-full border-2 border-[#FFD4DB] flex items-center justify-center text-3xl mb-4 shadow-sm">
              🐰
            </div>
            
            <h1 className="text-3xl font-black mb-2 text-[#5C4B40] tracking-wider">
              恋爱动物研究所
            </h1>
            
            <div className="text-sm font-bold mb-6 text-[#E1EED3] bg-[#5C4B40] px-4 py-1.5 rounded-full shadow-sm">
              🐾 你的灵魂动物是什么？
            </div>
            
            <p className="text-[#5C4B40]/80 mb-6 leading-relaxed font-medium text-sm text-center px-2">
              通过几个简单的情境测试，发现你在亲密关系中的隐藏小动物性格，获取专属的顺毛指南与恋爱贴士！
            </p>
            
            <div className="w-full bg-[#FFFDF0] border-2 border-[#E1EED3] rounded-2xl p-4 mb-8">
              <p className="text-xs font-bold text-[#5C4B40]/70 flex justify-center items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD4DB] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFD4DB]"></span>
                </span>
                ✨ 正在排队认领动物的饲养员: <span className="text-[#FFD4DB] text-sm">{onlineCount || '--'}</span>
              </p>
            </div>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStartTest('', 'single')}
              className="w-full bg-[#FFD4DB] text-[#5C4B40] border-2 border-[#FFD4DB] shadow-[0_4px_0_#E1EED3] py-4 rounded-2xl font-black text-lg tracking-widest transition-all mb-4"
            >
              开启奇妙测试
            </motion.button>

            <div className="flex gap-3 mt-2 w-full">
              <button 
                onClick={() => setShowHistory(true)}
                className="flex-1 py-3 text-xs font-bold text-[#5C4B40]/60 hover:text-[#5C4B40] hover:bg-[#FFFDF0] rounded-xl transition-colors"
              >
                历史图鉴
              </button>
              <button 
                onClick={() => window.open('https://xhslink.com/m/Atwtf3Cy6FR', '_blank')}
                className="flex-1 py-3 text-xs font-bold text-[#5C4B40]/60 hover:text-[#5C4B40] hover:bg-[#FFFDF0] rounded-xl transition-colors"
              >
                饲养装备
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* History Modal */}
      {showHistory && (
          <div className="fixed inset-0 z-50 bg-[#5C4B40]/40 backdrop-blur-sm flex flex-col justify-end">
              <div className="bg-[#FDFBF7] text-[#5C4B40] rounded-t-3xl p-6 pb-[max(32px,env(safe-area-inset-bottom))] w-full max-w-lg mx-auto h-[70vh] flex flex-col relative animate-fade-in-up">
                  <div className="w-12 h-1.5 bg-[#5C4B40]/20 rounded-full mx-auto mb-6"></div>
                  <button onClick={() => setShowHistory(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center font-bold text-[#5C4B40]/40 hover:text-[#5C4B40] transition-colors">✕</button>
                  
                  <h2 className="text-xl font-black mb-6 text-center">你的历史图鉴 📖</h2>
                  
                  <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-4 scrollbar-hide">
                      {historyRecords.length === 0 ? (
                        <div className="text-[#5C4B40]/40 text-sm mt-12 text-center font-bold">还没有收集到小动物，快去测试吧~</div>
                      ) : (
                        [...historyRecords].map((record, index) => {
                          const id = record.recordId || record.id;
                          const recordResult = record.result;
                          return (
                            <motion.button 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              key={`ls-history-${id ?? 'item'}-${index}`}
                              onClick={() => {
                                if (!recordResult) return;
                                onRestoreHistory({ ...recordResult, recordId: id });
                              }}
                              className="w-full text-left p-4 bg-[#FFFDF0] border-2 border-[#E1EED3] rounded-2xl hover:border-[#FFD4DB] transition-colors flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-black text-base text-[#5C4B40] mb-1">{recordResult?.title || '未知小可爱'}</div>
                                    <div className="text-xs font-bold text-[#5C4B40]/50">No. {id ? id.toString().slice(0, 6) : '001'}</div>
                                </div>
                                <div className="text-2xl">{recordResult?.emoji || '🐾'}</div>
                              </motion.button>
                          );
                        })
                      )}
                  </div>
              </div>
          </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
}
