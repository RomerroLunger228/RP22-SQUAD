import { useState, useRef, useEffect } from 'react';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  className?: string;
}

export default function ActionMenu({ items, className = '' }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item: ActionMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  const getItemClasses = (item: ActionMenuItem) => {
    const baseClasses = 'w-full px-3 py-2 text-sm font-montserrat text-left rounded-lg transition-colors flex items-center gap-2';
    
    if (item.disabled) {
      return `${baseClasses} text-gray-500 cursor-not-allowed`;
    }
    
    if (item.variant === 'danger') {
      return `${baseClasses} text-red-300 hover:bg-red-500/20 hover:text-red-200`;
    }
    
    return `${baseClasses} text-gray-300 hover:bg-gray-700/50 hover:text-white`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Кнопка с тремя точками */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md transition-colors"
        aria-label="Дополнительные действия"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>

      {/* Выпадающее меню */}
      <div
        className={`absolute right-0 top-full mt-1 w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-lg py-1 z-50 transition-all duration-200 origin-top-right ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
        }`}
      >
        <div ref={menuRef}>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={getItemClasses(item)}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}