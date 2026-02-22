export interface UserCommentLimits {
  userId: number;
  completedAppointments: number;
  totalComments: number;
  availableComments: number;
  canComment: boolean;
}

export interface CommentLimitResponse {
  success: boolean;
  limits: UserCommentLimits;
  message?: string;
}

export interface CommentCreationRequest {
  content: string;
  userId: number;
}

export interface CommentValidationResult {
  isValid: boolean;
  error?: string;
  limits?: UserCommentLimits;
}