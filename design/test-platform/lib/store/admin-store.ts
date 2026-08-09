import { create } from 'zustand';

interface AdminState {
  isUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isUnlocked: false,
  unlock: () => set({ isUnlocked: true }),
  lock: () => set({ isUnlocked: false }),
}));
