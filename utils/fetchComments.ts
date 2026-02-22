/**
 * API для работы с комментариями
 * Миграция с fetch на axios с полной типизацией
 */

import { Comment } from "@/types/comment";
import apiClient from '@/lib/axios';

interface CommentData {
    userId: number;
    content: string;
}

/**
 * Получает все комментарии
 */
export async function fetchComments(): Promise<Comment[]> {
    const response = await apiClient.get<Comment[]>('/api/comments');
    return response.data;
}

/**
 * Создает новый комментарий
 */
export async function createComment({ userId, content }: CommentData): Promise<Comment> {
    const response = await apiClient.post<Comment>('/api/comments', {
        userId,
        content
    });
    return response.data;
}

/**
 * @deprecated Используйте createComment вместо updateComments
 */
export const updateComments = createComment;