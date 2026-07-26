'use client';

import { useState } from 'react';
import BackgroundLayers from './components/BackgroundLayers';
import TestEngine from './components/TestEngine';
import ResultReceipt from './components/ResultReceipt';
import Home from './components/Home';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'test' | 'result'>('home');
  const [result, setResult] = useState<any>(null);

  const handleFinishTest = (finalResult: any) => {
    setResult(finalResult);
    setCurrentView('result');
  };

  const handleRestart = () => {
    setResult(null);
    setCurrentView('home');
  };

  const handleRestoreHistory = (recordResult: any) => {
    setResult(recordResult);
    setCurrentView('result');
  };

  return (
    <div className="brutalist-theme font-mono flex flex-col min-h-[100dvh]">
      <BackgroundLayers />
      
      {currentView === 'home' && (
        <Home 
          onStartTest={() => setCurrentView('test')} 
          onRestoreHistory={handleRestoreHistory} 
        />
      )}

      {currentView === 'test' && (
        <TestEngine 
          onBack={() => {
            setCurrentView('home');
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
