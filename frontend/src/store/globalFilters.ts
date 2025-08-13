import { create } from 'zustand';

export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface GlobalFiltersState {
  department: string;
  store: string;
  timePeriod: TimePeriod;
  date: Date | null;
  draft: {
    department: string;
    store: string;
    timePeriod: TimePeriod;
    date: Date | null;
  };
  setDraft: (p: Partial<GlobalFiltersState['draft']>) => void;
  apply: () => void;
  reset: () => void;
}

const defaultState = {
  department: '',
  store: '',
  timePeriod: 'week' as TimePeriod,
  date: new Date(),
};

export const useGlobalFilters = create<GlobalFiltersState>((set, get) => ({
  ...defaultState,
  draft: { ...defaultState },
  setDraft: (p) => set({ draft: { ...get().draft, ...p } }),
  apply: () => {
    const d = get().draft;
    set({ department: d.department, store: d.store, timePeriod: d.timePeriod, date: d.date });
  },
  reset: () => set({ ...defaultState, draft: { ...defaultState } }),
}));
