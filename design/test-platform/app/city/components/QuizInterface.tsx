'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizStore } from '../lib/store/useQuizStore';

interface Option { t: string; e?: number[] }
interface Question { text: string; opts: Option[] }

export default function QuizInterface() {
  const { currentStep, nextStep, prevStep, answers } = useQuizStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch('/api/city/questions');
        const data = await res.json();
        if (data.success && data.data?.questions) {
          setQuestions(data.data.questions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">加载安检设备中...</div>;
  if (!questions.length) return <div className="min-h-screen flex items-center justify-center">暂无题库</div>;

  const currentQ = questions[currentStep];
  const isLast = currentStep === questions.length - 1;

  const handleOptionClick = (idx: number) => {
    const coordsDelta = currentQ.opts[idx]?.e || [0, 0, 0, 0, 0];
    nextStep(coordsDelta, idx, isLast);
  };

  // 安检站台名称对应
  const getStationLabel = (step: number) => {
    if (step < 5) return '【一号安检口·情绪核验】';
    if (step < 10) return '【二号扫描站·社交行李】';
    if (step < 15) return '【三号过闸区·灵魂温度】';
    return '【终点站台·城市契合定位】';
  };

  const progressPct = Math.round(((currentStep + 1) / questions.length) * 100);

  return (
    <section className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-8 max-w-md mx-auto">
      {/* 顶部列车安检路线图与标尺 */}
      <div className="w-full bg-[#fdfbf7]/95 border-2 border-[#d1cdc1] p-3 rounded mb-6 shadow-md text-[#1a1a1a]">
        <div className="flex justify-between items-center text-xs font-bold font-mono mb-2">
          <button 
            onClick={() => useQuizStore.setState({ hasStarted: false, hasGenerated: false, currentStep: 0, answers: [] })}
            className="hover:text-red-600 transition-colors underline underline-offset-4 flex items-center gap-1"
          >
            &larr; 退票/返回首页
          </button>
          <span className="bg-[#1a1a1a] text-[#fdfbf7] px-2 py-0.5 rounded text-[10px] tracking-wider">
            CHECKPOINT {String(currentStep + 1).padStart(2, '0')}/{questions.length}
          </span>
        </div>

        <div className="text-left font-mono text-[11px] font-bold text-gray-700 mb-1 flex justify-between items-center">
          <span>{getStationLabel(currentStep)}</span>
          <span className="text-red-600 font-mono text-[10px]">PASS RATE {progressPct}%</span>
        </div>

        {/* 轨道刻度进度条 */}
        <div className="w-full h-2.5 bg-[#e4dfd4] rounded-full overflow-hidden border border-[#1a1a1a]/20 shadow-inner p-0.5">
          <motion.div 
            className="h-full bg-[#1a1a1a] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="w-full flex flex-col gap-5"
        >
          <div className="relative bg-[#fdfbf7] text-[#1a1a1a] w-full p-6 min-h-[90px] flex flex-col justify-center rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-2 border-[#d1cdc1] before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:-left-4 before:w-8 before:h-8 before:bg-[#1a1a1a] before:rounded-full before:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] before:border-2 before:border-[#d1cdc1] before:border-r-transparent before:border-t-transparent before:rotate-45 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-right-4 after:w-8 after:h-8 after:bg-[#1a1a1a] after:rounded-full after:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] after:border-2 after:border-[#d1cdc1] after:border-l-transparent after:border-b-transparent after:rotate-45">
            <h2 className="text-lg sm:text-xl font-bold leading-relaxed mb-1 text-current text-center">{currentQ.text}</h2>
          </div>

          <div className="w-full flex flex-col gap-3 min-h-[220px]">
            {currentQ.opts.map((opt, idx) => {
              const abcd = ['A', 'B', 'C', 'D'];
              const isSelected = answers[currentStep] === idx;
              const isDisabled = answers.length === questions.length;
              return (
                <button
                  key={idx}
                  disabled={isDisabled}
                  onClick={() => handleOptionClick(idx)}
                  className={`w-full text-left border-2 border-[#1a1a1a] px-4 py-3.5 min-h-[76px] flex items-center justify-between rounded shadow-[0_4px_12px_rgba(0,0,0,0.06)] font-medium leading-relaxed transition-all duration-200 relative overflow-hidden ${isSelected ? 'bg-black text-white translate-y-0.5 shadow-none' : 'bg-white text-[#1a1a1a] hover:bg-gray-50 active:scale-[0.98]'} ${isDisabled ? 'opacity-80 cursor-default' : ''}`}
                >
                  <div className="relative z-10 flex gap-3 font-bold w-full items-center">
                    <span className="shrink-0 font-mono text-sm">{isSelected ? '[x]' : '[ ]'}</span>
                    <span className="text-sm sm:text-base">{abcd[idx]}. {opt.t}</span>
                  </div>

                  {/* 选中时的防伪验票盖戳徽标 */}
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 1.5, opacity: 0, rotate: -25 }}
                      animate={{ scale: 1, opacity: 1, rotate: -12 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 border-2 border-red-500 text-red-500 font-mono text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest bg-red-500/10 pointer-events-none select-none shrink-0"
                    >
                      打孔/PASS
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
          
          {currentStep === questions.length - 1 && answers.length === questions.length && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex justify-center"
            >
              <button 
                onClick={() => useQuizStore.getState().setHasGenerated(true)} 
                className="bg-black text-white px-8 py-4 font-bold tracking-widest shadow-[4px_4px_0px_rgba(0,0,0,0.3)] border-2 border-black hover:bg-gray-800 transition-colors w-full rounded"
              >
                生成专属契合车票 &rarr;
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex justify-between items-center w-full min-h-[24px]">
        {currentStep > 0 && (
          <button 
            onClick={prevStep} 
            className="text-xs text-gray-400 hover:text-white transition-colors tracking-widest underline underline-offset-4 font-mono font-bold"
          >
            [ &larr; 撤回上一站 ]
          </button>
        )}
      </div>
    </section>
  );
}
