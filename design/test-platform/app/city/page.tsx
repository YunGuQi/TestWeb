'use client';

import { useEffect, useRef } from 'react';
import { useQuizStore } from './lib/store/useQuizStore';
import LandingPage from './components/LandingPage';
import QuizInterface from './components/QuizInterface';
import ResultView from './components/ResultView';
import DynamicBackground from './components/DynamicBackground';

export default function Home() {
  const { hasStarted, hasGenerated, deviceId, setDeviceId } = useQuizStore();
  const isPopState = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!deviceId) {
      const newId = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      setDeviceId(newId);
    }
  }, [deviceId, setDeviceId]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      isPopState.current = true;
      if (e.state && e.state.step) {
        if (e.state.step === 'home') {
          useQuizStore.setState({ hasStarted: false, hasGenerated: false });
        } else if (e.state.step === 'test') {
          useQuizStore.setState({ hasStarted: true, hasGenerated: false });
        } else if (e.state.step === 'result') {
          useQuizStore.setState({ hasStarted: true, hasGenerated: true });
        }
      } else {
        useQuizStore.setState({ hasStarted: false, hasGenerated: false });
      }
      setTimeout(() => { isPopState.current = false; }, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isPopState.current) return;
    const step = (!hasStarted) ? 'home' : (!hasGenerated ? 'test' : 'result');
    
    if (!mounted.current) {
      window.history.replaceState({ step }, '', '');
      mounted.current = true;
    } else {
      window.history.pushState({ step }, '', '');
    }
  }, [hasStarted, hasGenerated]);

  const renderContent = () => {
    if (!hasStarted) {
      return <LandingPage />;
    }
    if (!hasGenerated) {
      return <QuizInterface />;
    }
    return <ResultView />;
  };

  return (
    <>
      <DynamicBackground />
      <div className="relative z-10 min-h-screen">
        {renderContent()}
      </div>
    </>
  );
}
