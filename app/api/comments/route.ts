import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId, createUnauthorizedResponse } from '@/lib/auth-jwt';
import { validateCommentCreation } from '@/services/comment-limits.service';

interface CommentWithUser {
  id: bigint;
  content: string | null;
  created_at: Date;
  users: {
    username: string;
    avatar_url: string | null;
  } | null;
}

export async function GET() {
  try {
    const comments = await prisma.comments.findMany({
      include: {
        users: true,
      }});
    
    // Конвертируем BigInt в Number для сериализации
    const serializedComments = comments.map((comment: CommentWithUser) => ({
      id: Number(comment.id),
      content: comment.content,
      username: comment.users?.username,
      avatar: comment.users?.avatar_url,
      avatar_url: comment.users?.avatar_url,
      created_at: comment.created_at?.toISOString(),
    }));
    
    return NextResponse.json(serializedComments);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ JWT авторизация без DB запроса
    const userId = await getCurrentUserId(request);
    
    if (!userId) {
      return createUnauthorizedResponse();
    }

    // ✅ Проверяем лимиты комментариев
    const validation = await validateCommentCreation(userId);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: validation.error,
          limits: validation.limits
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = body;
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Контент комментария не может быть пустым' },
        { status: 400 }
      );
    }
    
    const comment = await prisma.comments.create({
      data: {
        user_id: userId,
        content: content.trim()
      },
      include: {
        users: true
      }
    });
    
    // Возвращаем созданный комментарий в том же формате, что и GET
    const serializedComment = {
      id: Number(comment.id),
      content: comment.content,
      username: comment.users?.username,
      avatar: comment.users?.avatar_url,
      avatar_url: comment.users?.avatar_url,
      created_at: comment.created_at?.toISOString(),
    };
    
    return NextResponse.json(serializedComment);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(){
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}