"use client"

import { MessageIcon } from "../icons/Icons";

interface ProfileTabsProps {
  activeTab?: 'grid' | 'comments';
  onTabChange?: (tab: 'grid' | 'comments') => void;
}

export default function ProfileTabs({ activeTab = 'grid', onTabChange }: ProfileTabsProps) {
  return (
    <div className="flex border-t border-gray-800">
      <button 
        className={`flex-1 p-4 items-center justify-center ${activeTab === 'grid' ? 'border-b-2 border-white' : ''}`}
        onClick={() => onTabChange?.('grid')}
      >
        <svg className="mx-auto" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" stroke={activeTab === 'grid' ? 'white' : 'gray'} strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" stroke={activeTab === 'grid' ? 'white' : 'gray'} strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" stroke={activeTab === 'grid' ? 'white' : 'gray'} strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" stroke={activeTab === 'grid' ? 'white' : 'gray'} strokeWidth="2"/>
        </svg>
      </button>
      <button 
        className={`flex-1 p-4 flex items-center justify-center ${activeTab === 'comments' ? 'border-b-2 border-white' : ''}`}
        onClick={() => onTabChange?.('comments')}
      >
        <div className={activeTab === 'comments' ? 'text-white' : 'text-gray-500'}>
          <MessageIcon />
        </div>
      </button>
    </div>
  );
}