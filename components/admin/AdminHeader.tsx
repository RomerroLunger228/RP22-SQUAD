/**
 * Заголовок админки
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Навигация обратно на главную
 * - Заголовок и описание админки
 * - Липкое позиционирование для удобства
 * - Единообразный дизайн
 */

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

/**
 * Компонент заголовка админки
 * 
 * ЛОГИКА ДИЗАЙНА:
 * - Липкий хедер (sticky) остается наверху при скролле
 * - Кнопка "Назад" для быстрого возврата
 * - Градиентный фон с blur эффектом
 * - Адаптивная типографика
 */
const AdminHeader: React.FC = React.memo(() => {
  return (
    <div className="sticky top-0 z-50 bg-[#111213] border-b border-[#222222] px-4 py-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Кнопка "Назад" */}
        <Link href="/">
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors duration-200 group"
            aria-label="Вернуться на главную страницу"
          >
            <ChevronLeft className="w-5 h-5 text-white group-hover:text-white transition-colors" />
          </button>
        </Link>
        
        {/* Заголовок и описание */}
        <div>
          <h1 className="text-2xl font-montserrat font-semibold text-white">
            Админ-панель
          </h1>
          <p className="text-[#BBBDC0] text-sm font-montserrat">
            Управление системой
          </p>
        </div>
      </div>
    </div>
  );
});

AdminHeader.displayName = 'AdminHeader';

export default AdminHeader;