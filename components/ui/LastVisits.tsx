"use client";

import VisitCard from "./VisitCard";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

interface Visit {
  serviceName: string;
  date: string;
  time: string;
  points: number;
}

export default function LastVisits() {
  const { data: visits = [], isLoading: loading } = useQuery({
    queryKey: ['visits'],
    queryFn: async (): Promise<Visit[]> => {
      try {
        const response = await apiClient.get<Visit[]>('/api/visits');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch visits:', error);
        return []; // Возвращаем пустой массив при ошибке
      }
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    retry: false, // Не повторяем запрос при ошибке
  });

  return (
    <div className="w-full mt-4 bg-transparent border-black/30 border rounded-[16px] overflow-hidden relative">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 px-4 py-[10px]  backdrop-blur-md bg-black/100">
        <h2 className="text-[20px] font-montserrat font-medium leading-[28px]">
          Визиты
        </h2>
      </div>
      {/* <div className="pointer-events-none absolute top-0 left-0 bottom-0 h-6 bg-gradient-to-r from-black/60 to-green-500" />
      <div className="pointer-events-none absolute bottom-0 top-0 right-0 h-6 bg-gradient-to-l from-black/60 to-transparent" /> */}
      <div className="relative">
        {/* Scroll container */}
        <div className="min-h-[200px] max-h-[300px] overflow-y-auto px-4 py-2 flex flex-col gap-3 bg-transparent backdrop-blur-md ">
          {loading ? (
            <div className="text-center text-[#BBBDC0] py-6 font-montserrat">
              Загрузка...
            </div>
          ) : visits.length > 0 ? (
            visits.map((visit, index) => (
              <VisitCard key={index} {...visit} index={index} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-center text-[#BBBDC0] font-montserrat text-lg">
                Нет завершенных визитов
              </div>
              <div className="text-center text-[#666] font-montserrat text-sm mt-2">
                Ваши визиты появятся здесь после завершения
              </div>
            </div>
          )}

          {/* Fade indicators */}
          
        </div>
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black/100 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/60 to-transparent" />
        
      </div>
      {/* Scroll container */}
      
      
      
    </div>
  );
}
