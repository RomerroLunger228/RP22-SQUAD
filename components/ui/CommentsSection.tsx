'use client';

import { CommentsContainer } from '../comments/CommentsContainer';

interface CommentsSectionProps {
  initialComments?: any[]; // Deprecated - оставляем для backward compatibility
  loading?: boolean;        // Deprecated - оставляем для backward compatibility
  onLoadMore?: () => void;
  hasMore?: boolean;
  currentUser?: {
    id: number;
    username: string;
    avatar: string | null;
  };
}

/**
 * 🔄 ВРЕМЕННАЯ ОБЁРТКА ДЛЯ BACKWARD COMPATIBILITY
 * 
 * ✅ Безопасный рефакторинг: Старые импорты продолжают работать
 * ✅ Новая архитектура: Внутри используются новые компоненты
 * ✅ Постепенная миграция: Можно менять импорты по одному
 * 
 * 📚 ПЛАН МИГРАЦИИ:
 * 1. Заменили внутреннюю реализацию (этот шаг)
 * 2. Проверяем, что всё работает как раньше
 * 3. Постепенно меняем импорты на CommentsContainer
 * 4. Удаляем этот wrapper файл
 */
export default function CommentsSection(props: CommentsSectionProps) {
  // 📚 ОБУЧЕНИЕ: Wrapper просто передаёт всё в новый контейнер
  return <CommentsContainer {...props} />;
}