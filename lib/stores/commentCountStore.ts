import { create } from 'zustand';
import apiClient from '@/lib/axios';

interface CommentStore {
    commentsCount: number | null;
    appointmentsCount: number | null;
    updateCommentsCount: (newCount: number) => void;
    updateAppointmentsCount: (newCount: number) => void;
    incrementCommentsCount: () => void;
    incrementAppointmentsCount: () => void;
    fetchCounts: () => Promise<void>;
}

export const useCommentStore = create<CommentStore>((set) => ({
    commentsCount: null,
    appointmentsCount: null,
    updateCommentsCount: (newCount) => set({ commentsCount: newCount }),
    updateAppointmentsCount: (newCount) => set({ appointmentsCount: newCount }),
    incrementCommentsCount: () => set((state) => ({ commentsCount: state.commentsCount! + 1 })),
    incrementAppointmentsCount: () => set((state) => ({ appointmentsCount: state.appointmentsCount! + 1 })),
    fetchCounts: async () => {
        try {
            const response = await apiClient.get<{
                commentsCount: number;
                appointmentsCount: number;
            }>('/api/amount');
            
            set({ 
                commentsCount: response.data.commentsCount || 0,
                appointmentsCount: response.data.appointmentsCount || 0
            });
            
        } catch (error) {
            console.error('Failed to fetch counts:', error);
        }
    }


}))