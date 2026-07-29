"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useQuizStore } from "@/store-dl/useQuizStore";

export default function TestPage() {
  const router = useRouter();
  const { questions, currentIndex, answers, setAnswer, nextQuestion, prevQuestion, submitAnswers, fetchQuestions, isLoading, error } = useQuizStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    fetchQuestions();
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [fetchQuestions]);

  if (isLoading || questions.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          <p className="text-zinc-500 font-mono">加载测验数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-mono">
        {error}
      </div>
    );
  }

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progressPercentage = ((currentIndex + 1) / questions.length) * 100;

  const handleOptionSelect = (optionId: string) => {
    if (transitioning) return;
    setTransitioning(true);
    setAnswer(question.id, optionId);

    if (!isLastQuestion) {
      nextQuestion();
    }
  };

  const handleSubmit = async () => {
    if (!answers[question.id]) return; // Ensure last question is answered
    setIsSubmitting(true);
    let did = localStorage.getItem('deviceId');
    if (!did) {
      did = crypto.randomUUID();
      localStorage.setItem('deviceId', did);
    }
    
    const result = await submitAnswers(did);
    if (result.success && result.resultId) {
      if (result.currentRank) {
         localStorage.setItem('current_rank', result.currentRank.toString());
      }
      setTimeout(() => {
        router.push(`/destined-lover/result/${result.resultId}`);
      }, 800);
    } else {
      alert(result.error || "提交失败，请重试");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-pink-500/30 font-sans flex flex-col p-6">
      {/* Header & Progress */}
      <header className="w-full max-w-2xl mx-auto flex flex-col space-y-6 pt-4">
        <div className="flex items-center justify-between">
          {/* 左上角：返回首页 */}
          <button
            onClick={() => router.push("/destined-lover")}
            className="flex items-center space-x-1 p-2 pr-3 hover:bg-white/10 rounded-full transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
            <span className="text-sm text-zinc-500 group-hover:text-zinc-200 transition-colors">返回首页</span>
          </button>
          <span className="font-mono text-zinc-500 font-medium tracking-widest">
            {currentIndex + 1} / {questions.length}
          </span>
          <div className="w-20" />{/* 平衡右侧留白 */}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </header>

      {/* Question Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto flex flex-col justify-center py-12 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onAnimationComplete={() => setTransitioning(false)}
            className="space-y-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold leading-relaxed text-zinc-100">
              {question.text}
            </h2>

            <div className="space-y-4">
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden group flex items-center justify-between ${
                      isSelected
                        ? "border-pink-500 bg-pink-500/10 text-pink-50"
                        : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300"
                    }`}
                  >
                    <span className="text-lg leading-relaxed">{option.text}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0 ml-4"
                      >
                        <CheckCircle2 className="w-6 h-6 text-pink-500" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
            {/* 上一题按钮 - 选项下方左侧 */}
            <div className="flex items-start pt-2">
              <AnimatePresence>
                {currentIndex > 0 && (
                  <motion.button
                    key="prev-btn"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onClick={prevQuestion}
                    className="flex items-center space-x-1 px-3 py-2 rounded-full text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>上一题</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer / Submit Area - 仅最后一题显示提交按钮 */}
      <footer className="w-full max-w-2xl mx-auto pb-8 flex flex-col items-center gap-4">
        {isLastQuestion && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            disabled={!answers[question.id] || isSubmitting}
            onClick={handleSubmit}
            className="w-full sm:w-auto px-12 py-4 bg-white text-black font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-6 h-6 border-2 border-black border-t-transparent rounded-full"
              />
            ) : (
              "生成潜意识报告"
            )}
          </motion.button>
        )}
      </footer>
    </div>
  );
}
