import { prisma } from '@/lib/prisma';
import { UserCommentLimits, CommentValidationResult } from '@/types/comment-limits';

/**
 * Подсчитывает завершенные записи пользователя
 */
export async function getCompletedAppointmentsCount(userId: number): Promise<number> {
  const count = await prisma.appointments.count({
    where: {
      user_id: userId,
      status: 'completed'
    }
  });
  
  return count;
}

/**
 * Подсчитывает общее количество комментариев пользователя
 */
export async function getUserCommentsCount(userId: number): Promise<number> {
  const count = await prisma.comments.count({
    where: {
      user_id: userId
    }
  });
  
  return count;
}

/**
 * Получает лимиты комментариев для пользователя
 */
export async function getUserCommentLimits(userId: number): Promise<UserCommentLimits> {
  const [completedAppointments, totalComments] = await Promise.all([
    getCompletedAppointmentsCount(userId),
    getUserCommentsCount(userId)
  ]);

  const availableComments = Math.max(0, completedAppointments - totalComments);
  const canComment = availableComments > 0;

  return {
    userId,
    completedAppointments,
    totalComments,
    availableComments,
    canComment
  };
}

/**
 * Проверяет может ли пользователь создать комментарий
 */
export async function validateCommentCreation(userId: number): Promise<CommentValidationResult> {
  try {
    const limits = await getUserCommentLimits(userId);

    if (!limits.canComment) {
      return {
        isValid: false,
        error: `Вы достигли лимита комментариев (${limits.totalComments}/${limits.completedAppointments}). Завершите больше записей для создания новых комментариев.`,
        limits
      };
    }

    return {
      isValid: true,
      limits
    };
  } catch (error) {
    console.error('Error validating comment creation:', error);
    return {
      isValid: false,
      error: 'Ошибка проверки лимитов комментариев'
    };
  }
}

/**
 * Проверяет лимиты после создания комментария
 */
export async function checkLimitsAfterComment(userId: number): Promise<UserCommentLimits> {
  return getUserCommentLimits(userId);
}