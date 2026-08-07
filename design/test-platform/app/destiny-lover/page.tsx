'use client';

import { useState, useEffect } from 'react';
import Home from './components/Home';
import TestEngine from './components/TestEngine';
import ResultReceipt from './components/ResultReceipt';
import DestinyBackground from './components/DestinyBackground';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export default function DestinyLoverApp() {
  const [currentView, setCurrentView] = useState<'home' | 'test' | 'result'>('home');
  const [userInfo, setUserInfo] = useState<{ nickname: string; status: 'single' | 'dating' }>({ nickname: '', status: 'single' });
  const [result, setResult] = useState<any>(null);

  const reduce = useReducedMotion();

  const pageVariants = {
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
    // History state management to match city/emo tests
    window.history.replaceState({ view: 'home' }, '', '');

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.view) {
        setCurrentView(e.state.view);
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: 'home' | 'test' | 'result') => {
    setCurrentView(view);
    window.history.pushState({ view }, '', '');
  };

  const handleStartTest = (nickname: string, status: 'single' | 'dating') => {
    setUserInfo({ nickname, status });
    navigateTo('test');
  };

  const handleFinishTest = (finalResult: any) => {
    setResult(finalResult);
    
    // 强制保存到本地 LocalStorage，以防止 DB 挂掉时无历史记录
    try {
      if (typeof window !== 'undefined') {
        const historyKey = 'quiz_history';
        const existingStr = localStorage.getItem(historyKey);
        let history = existingStr ? JSON.parse(existingStr) : [];
        if (finalResult && finalResult.recordId) {
          const exists = history.find((h: any) => h.recordId === finalResult.recordId);
          if (!exists) {
            history.unshift({
              testId: 'destiny-lover',
              title: '命定恋人',
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
    navigateTo('home');
  };

  return (
    <DestinyBackground>
      <AnimatePresence mode="wait">
        {currentView === 'home' && (
          <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full h-full flex flex-col flex-1">
            <Home onStartTest={handleStartTest} onRestoreHistory={handleFinishTest} />
          </motion.div>
        )}

        {currentView === 'test' && (
          <motion.div key="test" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full h-full flex flex-col flex-1">
            <TestEngine 
              userInfo={userInfo}
              onBack={() => navigateTo('home')} 
              onFinish={handleFinishTest} 
            />
          </motion.div>
        )}

        {currentView === 'result' && (
          <motion.div key="result" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full h-full flex flex-col flex-1">
            <ResultReceipt 
              result={result} 
              userInfo={userInfo}
              onRestart={handleRestart} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </DestinyBackground>
  );
}

