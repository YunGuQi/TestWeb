'use client';

import { useState, useEffect } from 'react';
import BackgroundLayers from './components/BackgroundLayers';
import TestEngine from './components/TestEngine';
import ResultReceipt from './components/ResultReceipt';
import Home from './components/Home';
import SharedReceiptCard from './components/SharedReceiptCard';
import { parseSharePayload, SharePayload } from './utils/share';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'test' | 'result' | 'shared'>('home');
  const [result, setResult] = useState<any>(null);
  const [shareData, setShareData] = useState<SharePayload | null>(null);

  useEffect(() => {
    // 优先检查并解析来自二维码或分享链接的 share 参数
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const rawShare = searchParams.get('share');
      if (rawShare) {
        const parsed = parseSharePayload(rawShare, searchParams);
        if (parsed) {
          setShareData(parsed);
          setCurrentView('shared');
          window.history.replaceState({ view: 'shared' }, '', window.location.href);
          return;
        }
      }
    }

    // 常规进入时初始化 history state
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

  const navigateTo = (view: 'home' | 'test' | 'result' | 'shared') => {
    setCurrentView(view);
    window.history.pushState({ view }, '', '');
  };

  const handleFinishTest = (finalResult: any) => {
    setResult(finalResult);
    navigateTo('result');
  };

  const handleRestart = () => {
    setResult(null);
    navigateTo('home');
  };

  const handleRestoreHistory = (recordResult: any) => {
    setResult(recordResult);
    navigateTo('result');
  };

  // 好友裂变落地页：点击【我也要测】清除 URL 参数并无缝进入第一题答题
  const handleFriendStartTest = () => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({ view: 'test' }, '', window.location.pathname);
    }
    navigateTo('test');
  };

  const handleFriendGoHome = () => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({ view: 'home' }, '', window.location.pathname);
    }
    navigateTo('home');
  };

  return (
    <div className="brutalist-theme flex flex-col min-h-[100dvh] relative overflow-x-hidden selection:bg-red-600 selection:text-white">
      <BackgroundLayers />
      
      {currentView === 'shared' && shareData && (
        <SharedReceiptCard 
          shareData={shareData}
          onStartTest={handleFriendStartTest}
          onGoHome={handleFriendGoHome}
        />
      )}

      {currentView === 'home' && (
        <Home 
          onStartTest={() => navigateTo('test')} 
          onRestoreHistory={handleRestoreHistory} 
        />
      )}

      {currentView === 'test' && (
        <TestEngine 
          onBack={() => {
            navigateTo('home');
          }} 
          onFinish={handleFinishTest} 
        />
      )}

      {currentView === 'result' && (
        <ResultReceipt 
          result={result} 
          onRestart={handleRestart} 
        />
      )}
    </div>
  );
}

