'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Comment from './Comment';
import { Comment as CommentType } from '@/types/comment';
import { fetchComments, createComment } from '@/utils/fetchComments';
import { useCommentStore } from '@/lib/stores/commentCountStore';
import { useCanCreateComment } from '@/hooks/useCommentLimits';
import { CommentLimitsDisplay } from './CommentLimitsDisplay';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface CommentsSectionProps {
  initialComments?: CommentType[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  currentUser?: {
    id: number;
    username: string;
    avatar: string | null;
  };
}

export default function CommentsSection({ 
  onLoadMore,
  hasMore = false,
  currentUser
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const incrementCommentsCount = useCommentStore(state => state.incrementCommentsCount);
  const queryClient = useQueryClient();
  const { canComment, availableComments } = useCanCreateComment();

  // Query для загрузки комментариев
  const { data: comments, isLoading: loading } = useQuery({
    queryKey: ['comments'],
    queryFn: fetchComments,
    staleTime: 2 * 60 * 1000, // 2 минуты
  });

  // Mutation для создания комментария
  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: (newComment) => {
      // Optimistic update - добавляем новый комментарий к списку
      queryClient.setQueryData<CommentType[]>(['comments'], (old) => [
        newComment,
        ...(old || [])
      ]);
      // Инвалидируем кэш для синхронизации с сервером
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      // Обновляем лимиты комментариев
      queryClient.invalidateQueries({ queryKey: ['comment-limits'] });
      incrementCommentsCount();
      setNewComment('');
    },
    onError: (error) => {
      console.error('Failed to create comment:', error);
      
      // Проверяем, если это ошибка лимита комментариев
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData.limits) {
          toast.error(errorData.error || 'Достигнут лимит комментариев');
          // Обновляем лимиты в кэше
          queryClient.invalidateQueries({ queryKey: ['comment-limits'] });
          return;
        }
      }
      
      toast.error('Не удалось создать комментарий. Попробуйте еще раз.');
    },
  });

  const handleDelete = useCallback(async (commentId: number) => {
    // if (!confirm('Are you sure you want to delete this comment?')) return;
    
    // setComments(prev => removeCommentAndReplies(prev, commentId));
    console.log('deleted comment with id', {commentId})
  }, []);

  // Проверяем авторизацию после всех хуков
  if (!currentUser) {
    return (
      <div className="bg-black p-4 text-center">
        <p className="text-red-400">Необходимо авторизоваться для просмотра комментариев</p>
      </div>
    );
  }

  // Добавление нового комментария
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    if (!canComment) {
      toast.error(`Вы достигли лимита комментариев. Доступно: ${availableComments}`);
      return;
    }

    createCommentMutation.mutate({
      userId: currentUser.id,
      content: newComment
    });
  };

 

  if (loading) {
    return (
      <div className="bg-black">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-[#BBBDC0] font-montserrat">Загрузка комментариев...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black">
      
      {/* Форма добавления комментария */}
      <div className="px-4 py-4 mb-6">
        <div className="flex items-start gap-3">
          {/* Аватар текущего пользователя */}
          <div className="flex-shrink-0">
            <div className="relative">
              {currentUser.avatar ? (
                <Image
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-montserrat font-bold text-lg"
                  style={{background: 'linear-gradient(to right, #4F8A3E, #6B9E58)'}}
                >
                  {currentUser.username.charAt(0)}
                </div>
              )}
              <div 
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center"
                style={{background: 'linear-gradient(to right, #4F8A3E, #6B9E58)'}}
              >
                <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Поле ввода */}
          <div className="flex-1">
            <form onSubmit={handleSubmitComment}>
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-[#1A1A1A] text-white placeholder-[#BBBDC0] px-4 py-3 pr-32 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#7AB069] focus:border-transparent border border-[#2A2A2A] font-montserrat"
                  rows={3}
                  disabled={createCommentMutation.isPending || !canComment}
                  maxLength={350}
                />
                
                <div className="absolute bottom-3 right-3">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || createCommentMutation.isPending || !canComment}
                    className={`px-6 py-2 rounded-lg font-montserrat font-medium transition-all duration-300 ${
                      !newComment.trim() || createCommentMutation.isPending || !canComment
                        ? 'bg-[#2A2A2A] text-[#BBBDC0] cursor-not-allowed'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {createCommentMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Posting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Post Comment
                      </span>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Отображение лимитов комментариев */}
              <div className="mt-3">
                <CommentLimitsDisplay className="text-xs" />
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Список комментариев */}
      <div>
        {comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={{
                  ...comment,
                  
                }}
                currentUser={currentUser}
                
                
                
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#BBBDC0]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-montserrat font-semibold text-white mb-2">No comments yet</h3>
            <p className="text-[#BBBDC0] font-montserrat mb-6">Be the first to share your thoughts!</p>
           
          </div>
        )}
        
        {hasMore && (
          <div className="py-6 text-center mx-4">
            <button
              onClick={onLoadMore}
              className="px-6 py-2 rounded-lg font-montserrat font-medium bg-[#1A1A1A] text-[#BBBDC0] hover:text-white hover:bg-[#2A2A2A] transition-all border border-[#333333]"
            >
              Load more comments
            </button>
          </div>
        )}
      </div>
    </div>
  );
}