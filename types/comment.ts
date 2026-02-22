// types/comment.ts
export interface User {
  id: number;
  username: string;
  avatar: string | null;
  points?: number | null;
  subscribtion?: boolean;
  role?: string;
  avatar_url?: string | null;
}

export interface Comment {
  id: number;
  username: string;
  content: string;
  avatar: string | null;
}

export interface CommentsState {
  comments: Comment[];
  totalCount: number;
}

export interface CommentFormData {
  content: string;

}

