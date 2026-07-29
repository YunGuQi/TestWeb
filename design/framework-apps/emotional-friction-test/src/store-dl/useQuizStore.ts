import { create } from 'zustand';

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: number;
  text: string;
  options: Option[];
}

interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: Record<number, string>; // questionId -> optionId
  isLoading: boolean;
  error: string | null;
  
  fetchQuestions: () => Promise<void>;
  setAnswer: (questionId: number, optionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  reset: () => void;
  submitAnswers: (deviceId: string) => Promise<{ success: boolean; resultId?: string; currentRank?: number; error?: string }>;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  questions: [],
  currentIndex: 0,
  answers: {},
  isLoading: false,
  error: null,

  fetchQuestions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/questions-dl');
      const data = await res.json();
      if (data.success) {
        set({ questions: data.questions, isLoading: false });
      } else {
        set({ error: data.error || '加载题库失败', isLoading: false });
      }
    } catch (e) {
      set({ error: '网络错误', isLoading: false });
    }
  },

  setAnswer: (questionId, optionId) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: optionId },
    })),
    
  nextQuestion: () =>
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, Math.max(0, state.questions.length - 1)),
    })),
    
  prevQuestion: () =>
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0),
    })),
    
  reset: () => set({ currentIndex: 0, answers: {}, error: null }),
  
  submitAnswers: async (deviceId) => {
    const { answers } = get();
    try {
      const res = await fetch('/api/submit-dl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, deviceId })
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, resultId: data.result.id, currentRank: data.current_rank };
      }
      return { success: false, error: data.error };
    } catch (e) {
      return { success: false, error: '网络错误' };
    }
  }
}));
