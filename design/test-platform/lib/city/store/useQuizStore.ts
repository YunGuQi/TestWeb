import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Question {
  text: string;
  opts: { t: string }[];
}

interface QuizState {
  hasStarted: boolean;
  currentStep: number;
  userCoords: number[]; // [rhythm, env, temp, social, taste]
  answers: number[]; // Store index of chosen option for each question
  deviceId: string | null;
  historyStackCoords: number[][]; // For "undo" feature
  
  startQuiz: () => void;
  nextStep: (coordsDelta: number[], selectedOptIndex: number, isLast?: boolean) => void;
  prevStep: () => void;
  setDeviceId: (id: string) => void;
  reset: () => void;
  setAnswers: (answers: number[]) => void;
  setCurrentStep: (step: number) => void;
  hasGenerated: boolean;
  setHasGenerated: (val: boolean) => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      hasStarted: false,
      currentStep: 0,
      userCoords: [5, 5, 0, 5, 5],
      answers: [],
      deviceId: null,
      historyStackCoords: [],
      hasGenerated: false,

      startQuiz: () => set({ 
        hasStarted: true, 
        currentStep: 0, 
        userCoords: [5, 5, 0, 5, 5],
        answers: [],
        historyStackCoords: [],
        hasGenerated: false 
      }),
      
      nextStep: (coordsDelta, selectedOptIndex, isLast = false) => set((state) => {
        const newCoords = state.userCoords.map((v, i) => v + coordsDelta[i]);
        return {
          currentStep: isLast ? state.currentStep : state.currentStep + 1,
          userCoords: newCoords,
          answers: [...state.answers, selectedOptIndex],
          historyStackCoords: [...state.historyStackCoords, [...state.userCoords]]
        };
      }),
      
      prevStep: () => set((state) => {
        if (state.answers.length === 0) return state;
        const prevCoords = state.historyStackCoords[state.historyStackCoords.length - 1] || [5, 5, 0, 5, 5];
        const isFinished = state.answers.length > state.currentStep;
        return {
          currentStep: isFinished ? state.currentStep : Math.max(0, state.currentStep - 1),
          userCoords: [...prevCoords],
          answers: state.answers.slice(0, -1),
          historyStackCoords: state.historyStackCoords.slice(0, -1)
        };
      }),
      
      setDeviceId: (id) => set({ deviceId: id }),
      
      reset: () => set({ 
        hasStarted: false, 
        currentStep: 0, 
        userCoords: [5, 5, 0, 5, 5], 
        answers: [], 
        historyStackCoords: [],
        hasGenerated: false
      }),
      setAnswers: (answers) => set({ answers }),
      setCurrentStep: (step) => set({ currentStep: step, hasStarted: true }),
      setHasGenerated: (val) => set({ hasGenerated: val })
    }),
    {
      name: 'city-personality-storage',
      partialize: (state) => ({ deviceId: state.deviceId }), // Only persist deviceId
    }
  )
);
