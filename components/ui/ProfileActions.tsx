"use client"

interface ProfileActionsProps {
  onFollowClick?: () => void;
  onMessageClick?: () => void;
  onEmailClick?: () => void;
  onMoreClick?: () => void;
}

export default function ProfileActions({ 
  onFollowClick, 
  onMessageClick, 
  onEmailClick, 
  onMoreClick 
}: ProfileActionsProps) {
  return (
    <div className="flex gap-3 mb-6">
      <button 
        className="bg-blue-500 text-white px-6 py-2 rounded-lg flex-1 font-medium"
        onClick={onFollowClick}
      >
        Follow
      </button>
      <button 
        className="border border-gray-600 text-white px-6 py-2 rounded-lg flex-1 font-medium"
        onClick={onMessageClick}
      >
        Message
      </button>
      <button 
        className="border border-gray-600 text-white px-6 py-2 rounded-lg flex-1 font-medium"
        onClick={onEmailClick}
      >
        Email
      </button>
      <button 
        className="border border-gray-600 text-white px-3 py-2 rounded-lg"
        onClick={onMoreClick}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M6 9L10 13L14 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}