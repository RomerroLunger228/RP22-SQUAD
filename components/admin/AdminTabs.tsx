/**
 * Навигационные табы админки
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Отображение всех доступных табов
 * - Активное состояние текущего таба
 * - Иконки для визуального разделения
 * - Горизонтальный скролл на мобильных устройствах
 */

import React from 'react';
import { TabType } from '@/types/admin';
import { TAB_CONFIGS, ICON_MAP } from '@/utils/admin/constants';

interface AdminTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

/**
 * Компонент навигационных табов
 * 
 * ЛОГИКА UI:
 * - Использует конфигурацию из константы для консистентности
 * - Динамическая загрузка иконок через мапинг
 * - Горизонтальный скролл с скрытым скроллбаром
 * - Четкое визуальное разделение активного таба
 */
const AdminTabs: React.FC<AdminTabsProps> = React.memo(({ activeTab, onTabChange }) => {
  /**
   * Рендерит иконку таба
   * 
   * ЛОГИКА ИКОНОК:
   * - Динамическая загрузка из ICON_MAP
   * - Fallback если иконка не найдена
   * - Консистентный размер и стиль
   */
  const renderIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP];
    
    if (IconComponent) {
      return <IconComponent className="w-4 h-4 flex-shrink-0" />;
    }
    
    // Fallback если иконка не найдена
    return <div className="w-4 h-4 bg-gray-400 rounded flex-shrink-0" />;
  };

  return (
    <div className="px-4 py-4">
      <div 
        className="flex gap-2 overflow-x-auto overflow-y-hidden select-none touch-pan-x overscroll-x-contain scrollbar-hide"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      >
        {TAB_CONFIGS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-lg font-montserrat font-medium 
              transition-all duration-200 whitespace-nowrap text-sm
              ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-lg scale-105'
                  : 'bg-[#1A1A1A] text-[#BBBDC0] hover:bg-[#2A2A2A] hover:text-white hover:scale-102'
              }
            `}
            aria-pressed={activeTab === tab.id}
            aria-label={`Переключиться на ${tab.label}`}
          >
            {renderIcon(tab.icon)}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

AdminTabs.displayName = 'AdminTabs';

export default AdminTabs;