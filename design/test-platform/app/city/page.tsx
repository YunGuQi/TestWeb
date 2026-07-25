'use client';

import { useEffect } from 'react';
import { useQuizStore } from '../../lib/city/store/useQuizStore';
import LandingPage from '../../components/city/LandingPage';
import QuizInterface from '../../components/city/QuizInterface';
import ResultView from '../../components/city/ResultView';

export default function Home() {
  const { hasStarted, hasGenerated, deviceId, setDeviceId } = useQuizStore();

  useEffect(() => {
    if (!deviceId) {
      const newId = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      setDeviceId(newId);
    }
  }, [deviceId, setDeviceId]);

  if (!hasStarted) {
    return <LandingPage />;
  }

  if (!hasGenerated) {
    return <QuizInterface />;
  }

  return <ResultView />;
}
