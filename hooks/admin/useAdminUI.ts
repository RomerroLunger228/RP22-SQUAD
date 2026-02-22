/**
 * Хук для управления состоянием UI админки
 * 
 * ЛОГИКА ХУКА:
 * - Управление активными табами
 * - Состояния модальных окон и форм
 * - UI фильтры и поисковые запросы
 * - Состояния загрузки для отдельных операций
 */

import { useState } from 'react';
import { TabType } from '@/types/admin';

interface UseAdminUIReturn {
  // Табы
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  
  // Дополнительные UI состояния
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

/**
 * Кастомный хук для UI состояний админки
 * 
 * ЛОГИКА АРХИТЕКТУРЫ:
 * - Централизованное управление всеми UI состояниями
 * - Типизированные состояния для безопасности
 */
export function useAdminUI(): UseAdminUIReturn {
  // === ТАБЫ И НАВИГАЦИЯ ===
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  
  // === ДОПОЛНИТЕЛЬНЫЕ UI СОСТОЯНИЯ ===
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  
  /**
   * Переопределяем setActiveTab для дополнительной логики
   * 
   * ЛОГИКА: При смене таба можем сбрасывать определенные состояния
   */
  const handleSetActiveTab = (tab: TabType) => {
    // Очищаем поисковый запрос при смене таба (опционально)
    if (searchQuery) {
      setSearchQuery('');
    }
    
    setActiveTab(tab);
  };
  
  return {
    // Табы
    activeTab,
    setActiveTab: handleSetActiveTab,
    
    // Дополнительные UI состояния
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
  };
}