import { create } from 'zustand';

interface AppState {
  selectedDate: number;
  setSelectedDate: (date: number) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedDate: Date.now(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));
