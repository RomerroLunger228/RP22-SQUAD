/**
 * ПРИМЕР ИСПОЛЬЗОВАНИЯ НОВЫХ TanStack Query ХУКОВ
 * 
 * Этот компонент демонстрирует все новые возможности:
 * - Loading states на кнопках
 * - Disabled состояния при выполнении операций
 * - Optimistic updates
 * - Автоматическое кеширование и синхронизация
 * - Error handling из коробки
 */

'use client';

import { 
  useAdminData,
  useUpdateAppointmentStatus,
  useDeleteComment,
  useCreateBlockedTime,
  useDeleteBlockedTime
} from '@/hooks/admin/useAdminData';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function AdminButtonExample() {
  // Получаем данные с автоматическим кешированием
  const { 
    appointments, 
    comments, 
    blockedTimes, 
    loading,
    // Loading states для каждой операции отдельно!
    isUpdatingStatus,
    isDeletingComment,
    isAddingBlockedTime,
    isDeletingBlockedTime
  } = useAdminData();

  // Отдельные хуки для более гранулярного контроля
  const updateStatusMutation = useUpdateAppointmentStatus();
  const deleteCommentMutation = useDeleteComment();
  const createBlockedTimeMutation = useCreateBlockedTime();
  const deleteBlockedTimeMutation = useDeleteBlockedTime();

  const handleUpdateStatus = (appointmentId: number) => {
    // Кнопка автоматически станет disabled и покажет loading
    updateStatusMutation.mutate({
      appointmentId,
      status: 'completed'
    });
    // Optimistic update сработает мгновенно!
    // При ошибке автоматически откатится
  };

  const handleDeleteComment = (commentId: number) => {
    // Confirm уже встроен в хук
    if (confirm('Удалить комментарий?')) {
      deleteCommentMutation.mutate(commentId);
      // Комментарий исчезнет мгновенно (optimistic update)
    }
  };

  const handleCreateBlockedTime = () => {
    createBlockedTimeMutation.mutate({
      date: '2024-02-08',
      start_time: '12:00',
      end_time: '13:00',
      reason: 'Обед'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Загрузка данных...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Примеры кнопок с Loading States</h2>
      
      {/* СЕКЦИЯ: Обновление статуса записей */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Записи ({appointments.length})</h3>
        <div className="grid gap-2">
          {appointments.slice(0, 3).map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between p-3 border rounded">
              <span>Запись #{appointment.id} - {appointment.status}</span>
              <Button
                onClick={() => handleUpdateStatus(appointment.id)}
                disabled={
                  updateStatusMutation.isPending || 
                  isUpdatingStatus // Глобальный loading state
                }
                size="sm"
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Обновление...
                  </>
                ) : (
                  'Завершить'
                )}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* СЕКЦИЯ: Удаление комментариев */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Комментарии ({comments.length})</h3>
        <div className="grid gap-2">
          {comments.slice(0, 3).map((comment) => (
            <div key={comment.id} className="flex items-center justify-between p-3 border rounded">
              <span>Комментарий #{comment.id}</span>
              <Button
                onClick={() => handleDeleteComment(comment.id)}
                disabled={deleteCommentMutation.isPending || isDeletingComment}
                variant="destructive"
                size="sm"
              >
                {deleteCommentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Удаление...
                  </>
                ) : (
                  'Удалить'
                )}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* СЕКЦИЯ: Заблокированное время */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Заблокированное время ({blockedTimes.length})</h3>
          <Button
            onClick={handleCreateBlockedTime}
            disabled={createBlockedTimeMutation.isPending || isAddingBlockedTime}
          >
            {createBlockedTimeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Добавление...
              </>
            ) : (
              'Добавить блок'
            )}
          </Button>
        </div>
        
        <div className="grid gap-2">
          {blockedTimes.slice(0, 3).map((blockedTime) => (
            <div key={blockedTime.id} className="flex items-center justify-between p-3 border rounded">
              <span>{blockedTime.date} {blockedTime.start_time} - {blockedTime.end_time}</span>
              <Button
                onClick={() => deleteBlockedTimeMutation.mutate(blockedTime.id)}
                disabled={deleteBlockedTimeMutation.isPending || isDeletingBlockedTime}
                variant="outline"
                size="sm"
              >
                {deleteBlockedTimeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Удаление...
                  </>
                ) : (
                  'Удалить'
                )}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* ДЕМОНСТРАЦИЯ LOADING STATES */}
      <section className="p-4 bg-gray-50 rounded">
        <h4 className="font-semibold mb-2">Текущие Loading States:</h4>
        <div className="space-y-1 text-sm">
          <div>Обновление статуса: {isUpdatingStatus ? '✅ В процессе' : '❌ Неактивно'}</div>
          <div>Удаление комментария: {isDeletingComment ? '✅ В процессе' : '❌ Неактивно'}</div>
          <div>Добавление блока: {isAddingBlockedTime ? '✅ В процессе' : '❌ Неактивно'}</div>
          <div>Удаление блока: {isDeletingBlockedTime ? '✅ В процессе' : '❌ Неактивно'}</div>
        </div>
      </section>
      
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <h4 className="font-semibold text-green-800 mb-2">🎉 Новые возможности:</h4>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Кнопки автоматически disabled во время операций</li>
          <li>• Loading спиннеры появляются автоматически</li>
          <li>• Optimistic updates - изменения видны мгновенно</li>
          <li>• Автоматический откат при ошибках</li>
          <li>• Данные кешируются и синхронизируются в фоне</li>
          <li>• Toast уведомления о success/error из коробки</li>
          <li>• Request deduplication - дублирующиеся запросы не выполняются</li>
        </ul>
      </div>
    </div>
  );
}