import { describe, it, expect, beforeEach } from 'vitest';
import { useQuizStore } from '../useQuizStore';
import { questions } from '@/data/questions';

describe('useQuizStore Quiz Flow', () => {
  beforeEach(() => {
    useQuizStore.getState().reset();
  });

  it('should correctly calculate RDS archetype when all "A" answers are selected', () => {
    const store = useQuizStore.getState();
    
    questions.forEach((q) => {
      store.setAnswer(q.id, 'A');
    });

    const result = useQuizStore.getState().calculateResult();
    expect(result).toBe('RDS');
  });

  it('should correctly fallback to P-I-C when there is a tie', () => {
    // If no questions are answered, all scores are 0, meaning R=P, D=I, S=C (Tie)
    // The PRD mandates default fallback to P, I, C.
    const result = useQuizStore.getState().calculateResult();
    expect(result).toBe('PIC');
  });

  it('should auto-advance currentIndex correctly when nextQuestion is called until the end', () => {
    const store = useQuizStore.getState();
    expect(store.currentIndex).toBe(0);

    // Call nextQuestion equal to questions.length times
    for (let i = 0; i < questions.length; i++) {
      useQuizStore.getState().nextQuestion();
    }

    // It should not exceed questions.length - 1
    expect(useQuizStore.getState().currentIndex).toBe(questions.length - 1);
  });
});
