import { create } from 'zustand';
import { AxisScore, questions } from '@/data/questions';

interface QuizState {
  currentIndex: number;
  answers: Record<number, string>; // questionId -> optionId
  setAnswer: (questionId: number, optionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  reset: () => void;
  calculateResult: () => string; // Returns the 3-letter archetype code
}

export const useQuizStore = create<QuizState>((set, get) => ({
  currentIndex: 0,
  answers: {},
  setAnswer: (questionId, optionId) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: optionId },
    })),
  nextQuestion: () =>
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, questions.length - 1),
    })),
  prevQuestion: () =>
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0),
    })),
  reset: () => set({ currentIndex: 0, answers: {} }),
  calculateResult: () => {
    const { answers } = get();
    const scores: Record<AxisScore, number> = {
      R: 0, P: 0,
      D: 0, I: 0,
      S: 0, C: 0,
    };

    questions.forEach((q) => {
      const selectedOptionId = answers[q.id];
      if (!selectedOptionId) return;
      const option = q.options.find((o) => o.id === selectedOptionId);
      if (option && option.scores) {
        option.scores.forEach(({ axis, score }) => {
          scores[axis] += score;
        });
      }
    });

    // Resolve axes (ties break toward P, I, C as per PRD "兜底规则")
    const axis1 = scores.R > scores.P ? 'R' : 'P';
    const axis2 = scores.D > scores.I ? 'D' : 'I';
    const axis3 = scores.S > scores.C ? 'S' : 'C'; 

    return `${axis1}${axis2}${axis3}`;
  },
}));
