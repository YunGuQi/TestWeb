'use client';

import { useState, useEffect } from 'react';
import { generateSignature } from '../../../lib/security';
import { motion, AnimatePresence } from 'framer-motion';
import { Turnstile } from '@marsidev/react-turnstile';

interface QuizViewProps {
  userInfo: { nickname: string; status: 'single' | 'relationship' };
  onBack: () => void;
  onFinish: (result: any) => void;
}

export default function QuizView({ userInfo, onBack, onFinish }: QuizViewProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        await fetch('/api/init-test?testId=love-species');
        const timestamp = Date.now();
        const sign = await generateSignature("GET_QUESTIONS", timestamp);
        const res = await fetch('/api/questions?testId=love-species', {
          headers: {
            'x-timestamp': timestamp.toString(),
            'x-sign': sign
          }
        });
        const data = await res.json();
        if (data.success && data.questions) {
          setQuestions(data.questions);
        } else {
          setFetchError(data.error || '接口请求被拒绝，请同步您的设备时间后刷新重试');
        }
        setIsFetching(false);
      } catch (err) {
        console.error(err);
        setFetchError('网络连接断开，请检查网络后刷新重试');
        setIsFetching(false);
      }
    };
    fetchQuestions();
  }, []);

  if (isFetching) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen bg-paper text-[#2d2a26]">
        <div className="w-12 h-12 border-2 border-[#2d2a26] border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="typewriter text-xs font-bold uppercase tracking-widest">正在接入加密数据库...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen bg-paper text-[#2d2a26]">
         <div className="text-center font-bold font-mono text-[var(--stamp-red)] mb-4 text-sm">{fetchError}</div>
         <button onClick={() => window.location.reload()} className="border-2 border-[#2d2a26] px-6 py-2 text-xs font-bold hover:bg-[#2d2a26] hover:text-[#fdfbf7] transition-colors">重新请求授权</button>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="text-center mt-20 font-bold bg-paper min-h-screen pt-20">未找到档案数据。</div>;
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  const handleSelect = (qId: string, optId: string) => {
    const newAnswers = { ...answers, [qId]: optId };
    setAnswers(newAnswers);
    
    // Auto advance after slight delay for visual feedback
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }, 400); 
  };

  const submitAnswers = async (finalAnswers: any) => {
    setIsLoading(true);
    try {
      const payload = JSON.stringify({
        deviceId: localStorage.getItem('deviceId') || 'unknown',
        answers: finalAnswers,
        testId: 'love-species',
        metadata: userInfo,
        turnstileToken: turnstileToken
      });
      const timestamp = Date.now();
      const sign = await generateSignature(payload, timestamp);
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-timestamp': timestamp.toString(),
          'x-sign': sign
        },
        body: payload
      });
      const data = await res.json();
      if (data.success && data.result) {
        onFinish({ ...data.result, recordId: data.recordId, participantCount: data.participantCount });
      } else {
        alert('解析失败: ' + (data.error || '未知错误'));
        setIsLoading(false);
      }
    } catch(e) {
      alert('网络波动，请重试');
      setIsLoading(false);
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen bg-paper text-[#2d2a26]">
        <div className="flex gap-2 mb-6">
          <motion.div 
            animate={{ scale: [1, 1.5, 1] }} 
            transition={{ repeat: Infinity, duration: 1 }} 
            className="w-3 h-3 bg-[var(--stamp-red)] rounded-full"
          />
          <motion.div 
            animate={{ scale: [1, 1.5, 1] }} 
            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} 
            className="w-3 h-3 bg-[#2d2a26] rounded-full"
          />
          <motion.div 
            animate={{ scale: [1, 1.5, 1] }} 
            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} 
            className="w-3 h-3 bg-[#2d2a26] rounded-full"
          />
        </div>
        <p className="typewriter text-xs font-bold tracking-widest uppercase">正在编译行为分析模型...</p>
        <p className="text-gray-400 text-[10px] mt-2 uppercase typewriter">绝密文件，禁止外传</p>
      </div>
    );
  }

  // Apple-fluid spring transition
  const cardVariants = {
    initial: { opacity: 0, y: 100, scale: 0.9, rotate: -2 },
    animate: { opacity: 1, y: 0, scale: 1, rotate: 0 },
    exit: { opacity: 0, y: -100, scale: 0.95, filter: 'blur(10px)' }
  };

  return (
    <div className="flex-1 flex flex-col mx-auto w-full max-w-md min-h-[100dvh] bg-[#FFFDF0] relative overflow-hidden">
        {/* Header Progress - Scrapbook style */}
        <div className="w-full pt-8 px-6 pb-2 flex flex-col relative z-20">
            <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={onBack} 
                  className="text-xs font-bold text-[#5C4B40]/50 hover:text-[#5C4B40] transition-colors"
                >
                  ← 暂停测试
                </button>
                <div className="text-sm font-bold text-[#5C4B40]">
                  进度 <span className="text-[#FFD4DB]">{String(currentIndex + 1).padStart(2, '0')}</span> / {questions.length} 🐾
                </div>
            </div>
            
            <div className="w-full h-3 bg-[#FDFBF7] border-2 border-[#E1EED3] rounded-full relative overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="absolute top-0 left-0 h-full bg-[#FFD4DB] rounded-full" 
                />
            </div>
        </div>

        {/* Questions Body */}
        <div className="flex-1 w-full flex flex-col px-5 pt-6 pb-16 relative z-20 overflow-visible">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentQ.id}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.8 }}
                className="w-full bg-[#FDFBF7] p-6 rounded-3xl border-2 border-[#FFD4DB] shadow-[0_8px_30px_rgba(255,212,219,0.5)] flex flex-col h-full relative"
              >
                  {/* Washi Tape Decorations */}
                  <div className="absolute -top-3 left-[10%] w-20 h-6 bg-[#E1EED3]/80 backdrop-blur-sm -rotate-6 transform shadow-sm border border-[#E1EED3] z-20" />
                  
                  {/* Question Number Sticker */}
                  <div className="border-b-2 border-dashed border-[#FFD4DB] pb-4 mb-6 flex justify-between items-center">
                     <span className="text-sm font-black text-[#5C4B40] bg-[#FFD4DB]/30 px-3 py-1 rounded-full">
                       Q{currentIndex + 1} 🌸
                     </span>
                  </div>

                  <h2 className="text-xl font-black mb-8 leading-snug text-[#5C4B40] tracking-tight">
                      {currentQ.text}
                  </h2>
                  
                  <div className="space-y-4 mt-auto">
                      {currentQ.options.map((opt: any) => {
                        const isSelected = answers[currentQ.id] === opt.id;
                        return (
                          <motion.button 
                            key={opt.id} 
                            onClick={() => handleSelect(currentQ.id, opt.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            className={`w-full text-left px-4 py-3 border-2 rounded-2xl transition-colors duration-200 focus:outline-none flex items-center gap-3 ${
                              isSelected 
                                ? 'border-[#FFD4DB] bg-[#FFD4DB] text-[#5C4B40] shadow-sm' 
                                : 'border-[#E1EED3] bg-[#FFFDF0] hover:border-[#FFD4DB] text-[#5C4B40]/80'
                            }`}
                          >
                            <div className={`text-sm font-bold ${isSelected ? 'text-[#5C4B40]' : 'text-[#FFD4DB]'}`}>
                              {isSelected ? '✨' : '🐾'}
                            </div>
                            <span className="text-[13px] font-bold leading-snug">
                              {opt.text}
                            </span>
                          </motion.button>
                        );
                      })}
                  </div>

                  {currentIndex === questions.length - 1 && answers[currentQ.id] && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.5, type: "spring" }}
                      className="mt-8 flex flex-col items-center gap-4"
                    >
                      <div className="h-0 overflow-hidden opacity-0 pointer-events-none">
                        <Turnstile 
                          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                          onSuccess={(token) => setTurnstileToken(token)}
                        />
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => submitAnswers(answers)}
                        className="w-full bg-[#5C4B40] text-[#FFFDF0] shadow-[0_4px_0_#E1EED3] py-4 rounded-2xl font-black text-lg tracking-widest transition-all"
                      >
                        查看我的灵魂动物 💖
                      </motion.button>
                    </motion.div>
                  )}
              </motion.div>
            </AnimatePresence>
            
            {currentIndex > 0 && (
              <div className="absolute bottom-6 left-0 w-full text-center z-10">
                  <button 
                    onClick={handleUndo} 
                    className="text-xs font-bold text-[#5C4B40]/40 hover:text-[#5C4B40] transition-colors py-2 px-4"
                  >
                      ↺ 重新思考上一题
                  </button>
              </div>
            )}
        </div>
    </div>
  );
}
