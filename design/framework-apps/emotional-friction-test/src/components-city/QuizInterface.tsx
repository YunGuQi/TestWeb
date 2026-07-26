'use client';

import { useQuizStore } from '../store-city/useQuizStore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Option { t: string; e?: number[] }
interface Question { text: string; opts: Option[] }

export default function QuizInterface() {
  const router = useRouter();
  const { currentStep, nextStep, prevStep } = useQuizStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch('/api/city-questions');
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
  const isLast = currentStep === 19; // 20 questions

  const handleOptionClick = (idx: number) => {
    if (transitioning) return;
    setTransitioning(true);
    const coordsDelta = currentQ.opts[idx]?.e || [0, 0, 0, 0, 0];
    nextStep(coordsDelta, idx);
  };

  return (
    <div className="min-h-screen relative">
      <section className="page-section active max-w-md mx-auto py-8 px-4 flex flex-col justify-center">
        <div className="w-full flex justify-between items-center mb-8 font-mono text-sm font-bold opacity-70">
          <button onClick={() => setShowExitModal(true)} className="hover:text-black tracking-widest flex items-center gap-1 transition-colors">
            &larr; 返回大厅
          </button>
          <span>{String(currentStep + 1).padStart(2, '0')}/20</span>
        </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={() => setTransitioning(false)}
          className="w-full flex flex-col gap-6"
        >
          <div className="relative bg-[#fdfbf7] text-[#1a1a1a] w-full p-8 rounded shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-[#d1cdc1] before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:-left-4 before:w-8 before:h-8 before:bg-[#e6e4df] before:rounded-full before:shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] before:border before:border-[#d1cdc1] before:border-r-transparent before:border-t-transparent before:rotate-45 after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:-right-4 after:w-8 after:h-8 after:bg-[#e6e4df] after:rounded-full after:shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] after:border after:border-[#d1cdc1] after:border-l-transparent after:border-b-transparent after:rotate-45">
            <h2 className="text-xl font-bold leading-relaxed mb-2 text-current">{currentQ.text}</h2>
          </div>

          <div className="w-full flex flex-col gap-4">
            {currentQ.opts.map((opt, idx) => {
              const abcd = ['A', 'B', 'C', 'D'];
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  className="w-full text-left bg-white border border-[#1a1a1a] p-4 rounded text-[#1a1a1a] shadow-sm font-medium leading-relaxed hover:bg-gray-50 active:scale-[0.98] transition-transform"
                >
                  {abcd[idx]}. {opt.t}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex justify-between items-center w-full min-h-[24px]">
        {currentStep > 0 && (
          <button onClick={prevStep} className="text-sm text-gray-500 hover:text-black transition-colors tracking-widest underline underline-offset-4">
            撤回上一步
          </button>
        )}
        </div>
      </section>

      {/* 退出确认弹窗 */}
      {showExitModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans text-black">
          <div className="bg-white border-4 border-black w-full max-w-sm p-6 relative shadow-[8px_8px_0px_#000]">
            <h3 className="text-xl font-bold mb-4 tracking-wider">你要抛弃我了吗？</h3>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed font-bold">
              现在的进度将不会被保存，你确定要离开测试吗？
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 border-2 border-black font-bold hover:bg-gray-100 transition-colors"
              >
                继续答题
              </button>
              <button 
                onClick={() => router.push('/city-personality')}
                className="flex-1 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors border-2 border-red-600"
              >
                确认离开
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
