'use client';

import { useState, useEffect } from 'react';
import LandingView from './components/LandingView';
import QuizView from './components/QuizView';
import ResultView from './components/ResultView';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { parseLoveSpeciesShareKey } from './utils/share';
import { getSpeciesByKey } from '../../lib/love-species-client';

export default function LoveSpeciesApp() {
  const [currentView, setCurrentView] = useState<'landing' | 'quiz' | 'result'>('landing');
  const [userInfo, setUserInfo] = useState<{ nickname: string; status: 'single' | 'relationship' }>({ nickname: '', status: 'single' });
  const [result, setResult] = useState<any>(null);

  const reduce = useReducedMotion();

  const pageVariants: any = {
    initial: { 
      opacity: 0, 
      transform: reduce ? "translateY(0px) scale(1)" : "translateY(16px) scale(0.98)" 
    },
    animate: { 
      opacity: 1, 
      transform: "translateY(0px) scale(1)",
      transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] }
    },
    exit: { 
      opacity: 0, 
      transform: reduce ? "translateY(0px) scale(1)" : "translateY(-16px) scale(0.98)",
      transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
    }
  };

  useEffect(() => {
    // 优先检查并解析分享链接中的 share 参数
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const rawShare = searchParams.get('share');
      if (rawShare) {
        const profile = parseLoveSpeciesShareKey(rawShare);
        if (profile) {
          const clientSpecies = getSpeciesByKey(profile.key);
          setResult({
            id: clientSpecies.id || 1,
            key: profile.key,
            title: profile.title,
            emoji: profile.emoji,
            tags: profile.tags,
            bestMatch: profile.bestMatch,
            toxicMatch: profile.toxicMatch,
            oneLiner: profile.oneLiner,
            isSharedPreview: true
          });
          setUserInfo({ nickname: '好友', status: 'single' });
          setCurrentView('result');
          window.history.replaceState({ view: 'result' }, '', window.location.href);
          return;
        }
      }
    }

    window.history.replaceState({ view: 'landing' }, '', '');
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.view) {
        setCurrentView(e.state.view);
      } else {
        setCurrentView('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: 'landing' | 'quiz' | 'result') => {
    setCurrentView(view);
    window.history.pushState({ view }, '', '');
  };

  const handleStartTest = (nickname: string, status: 'single' | 'relationship') => {
    setUserInfo({ nickname, status });
    navigateTo('quiz');
  };

  const handleFinishTest = (finalResult: any) => {
    setResult(finalResult);
    
    // Save to localStorage
    try {
      if (typeof window !== 'undefined') {
        const historyKey = 'quiz_history';
        const existingStr = localStorage.getItem(historyKey);
        let history = existingStr ? JSON.parse(existingStr) : [];
        if (finalResult && finalResult.recordId) {
          const exists = history.find((h: any) => h.recordId === finalResult.recordId);
          if (!exists) {
            history.unshift({
              testId: 'love-species',
              title: '恋爱物种档案',
              timestamp: Date.now(),
              recordId: finalResult.recordId,
              result: finalResult
            });
            localStorage.setItem(historyKey, JSON.stringify(history));
          }
        }
      }
    } catch(e) {
      console.error(e);
    }
    
    navigateTo('result');
  };

  const handleRestart = () => {
    setResult(null);
    setUserInfo({ nickname: '', status: 'single' });
    navigateTo('landing');
  };

  const handleRestoreHistory = (recordResult: any) => {
    setResult(recordResult);
    navigateTo('result');
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F2EB] text-[#333333] font-sans selection:bg-[#FFD4DB]">
      <AnimatePresence mode="wait">
        {currentView === 'landing' && (
          <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full min-h-screen flex flex-col flex-1">
            <LandingView onStartTest={handleStartTest} onRestoreHistory={handleRestoreHistory} />
          </motion.div>
        )}

        {currentView === 'quiz' && (
          <motion.div key="quiz" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full min-h-screen flex flex-col flex-1">
            <QuizView 
              userInfo={userInfo}
              onBack={() => navigateTo('landing')} 
              onFinish={handleFinishTest} 
            />
          </motion.div>
        )}

        {currentView === 'result' && (
          <motion.div key="result" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full min-h-screen flex flex-col flex-1">
            <ResultView 
              result={result} 
              userInfo={userInfo}
              onRestart={handleRestart} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
