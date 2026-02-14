import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BatchState {
    activeBatchId: string | null;
    setActiveBatchId: (id: string | null) => void;
}

export const useBatchStore = create<BatchState>()(
    persist(
        (set) => ({
            activeBatchId: null,
            setActiveBatchId: (id) => set({ activeBatchId: id }),
        }),
        {
            name: 'batch-storage',
        }
    )
);
