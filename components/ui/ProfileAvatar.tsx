'use client';

import { useCommentStore } from '@/lib/stores/commentCountStore';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import PulseSkeleton from './PulseSkeleleton';
import apiClient from '@/lib/axios';




interface CountsData {
  commentsCount: number;
  appointmentsCount: number;
}

export default function ProfileAvatar() {
  const updateCommentsCount = useCommentStore(state => state.updateCommentsCount);
  const updateAppointmentsCount = useCommentStore(state => state.updateAppointmentsCount);

  const { data: counts, isLoading } = useQuery({
    queryKey: ['profile-counts'],
    queryFn: async (): Promise<CountsData> => {
      const response = await apiClient.get<CountsData>('/api/amount');
      // Update the Zustand store with the fetched data
      updateCommentsCount(response.data.commentsCount || 0);
      updateAppointmentsCount(response.data.appointmentsCount || 0);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  

  


  
  return (
    <div className="flex items-center gap-6 mb-6">
      <div className="w-20 h-20 rounded-full overflow-hidden">
        <Image 
          src="/logo.JPG" 
          alt="Profile Logo" 
          width={80}
          height={80}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex gap-8">
        {/* Posts - всегда статично */}
        <div className="text-center">
          <div className="text-xl font-semibold h-7 flex items-center justify-center">
            {isLoading ? (
              <PulseSkeleton />
            ) : (
              3
            )}
          </div>
          <div className="text-gray-400 text-sm">Posts</div>
        </div>
        
        {/* Appointments */}
        <div className="text-center">
          <div className="text-xl font-semibold h-7 flex items-center justify-center">
            {isLoading ? (
              <PulseSkeleton />
            ) : (
              counts?.appointmentsCount ?? '0'
            )}
          </div>
          <div className="text-gray-400 text-sm">Appointments</div>
        </div>
        
        {/* Comments */}
        <div className="text-center">
          <div className="text-xl font-semibold h-7 flex items-center justify-center">
            {isLoading ? (
              <PulseSkeleton />
            ) : (
              counts?.commentsCount ?? '0'
            )}
          </div>
          <div className="text-gray-400 text-sm">Comments</div>
        </div>
      </div>
    </div>
  );
}
