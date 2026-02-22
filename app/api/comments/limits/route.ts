import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth-jwt';
import { getUserCommentLimits } from '@/services/comment-limits.service';
import { CommentLimitResponse } from '@/types/comment-limits';

/**
 * GET /api/comments/limits
 * Получает лимиты комментариев для текущего пользователя
 */
export async function GET(request: NextRequest): Promise<NextResponse<CommentLimitResponse>> {
  try {
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          limits: {
            userId: 0,
            completedAppointments: 0,
            totalComments: 0,
            availableComments: 0,
            canComment: false
          },
          message: 'Пользователь не авторизован'
        },
        { status: 401 }
      );
    }

    const limits = await getUserCommentLimits(userId);

    return NextResponse.json({
      success: true,
      limits
    });

  } catch (error) {
    console.error('Error getting comment limits:', error);
    
    return NextResponse.json(
      {
        success: false,
        limits: {
          userId: 0,
          completedAppointments: 0,
          totalComments: 0,
          availableComments: 0,
          canComment: false
        },
        message: 'Ошибка получения лимитов комментариев'
      },
      { status: 500 }
    );
  }
}