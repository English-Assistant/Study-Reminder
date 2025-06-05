import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useUserStore } from './user.store';

interface ReviewMemoryState {
  lastSelectedCourseId: Record<string, string>; // userId -> courseId 映射
  getSelectedCourse: () => string | undefined;
  setSelectedCourse: (courseId: string) => void;
}

export const useReviewMemoryStore = create<ReviewMemoryState>()(
  persist(
    (set, get) => ({
      lastSelectedCourseId: {},

      getSelectedCourse: () => {
        const userId = useUserStore.getState().user?.id;
        if (!userId) return undefined;
        return get().lastSelectedCourseId[userId];
      },

      setSelectedCourse: (courseId: string) => {
        const userId = useUserStore.getState().user?.id;
        if (!userId || !courseId) return;

        set((state) => ({
          lastSelectedCourseId: {
            ...state.lastSelectedCourseId,
            [userId]: courseId,
          },
        }));
      },
    }),
    {
      name: 'review-memory-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lastSelectedCourseId: state.lastSelectedCourseId,
      }),
    },
  ),
);
