'use client';

import { useQuizStore } from '../../store-city/useQuizStore';
import LandingPage from '../../components-city/LandingPage';
import QuizInterface from '../../components-city/QuizInterface';
import ResultView from '../../components-city/ResultView';

export default function Home() {
  const { hasStarted, currentStep, answers } = useQuizStore();

  if (!hasStarted) {
    return <LandingPage />;
  }

  // There are 20 questions total
  if (currentStep < 20 && answers.length < 20) {
    return <QuizInterface />;
  }

  return <ResultView />;
}
