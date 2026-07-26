'use client';

import { useState, useEffect } from 'react';
import BackgroundLayers from './components/BackgroundLayers';
import TestEngine from './components/TestEngine';
import ResultReceipt from './components/ResultReceipt';
import Home from './components/Home';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'test' | 'result'>('home');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // When the component mounts, set the initial history state
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

  return (
    <div className="brutalist-theme font-mono flex flex-col min-h-[100dvh]">
      <BackgroundLayers />
      
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
