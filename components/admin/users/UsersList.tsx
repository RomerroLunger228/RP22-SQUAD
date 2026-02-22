/**
 * Список пользователей системы
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Отображение всех зарегистрированных пользователей
 * - Информация о балах, ролях и подписках
 * - Возможности для будущего расширения (редактирование, блокировка)
 * - Поиск и фильтрация пользователей
 */

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { User } from '@/types/admin';
import { UserModal } from './UserModal';
import UserAvatar from '@/components/ui/UserAvatar';

interface UsersListProps {
  users: User[];
  loading?: boolean;
  onDataChange?: () => Promise<void>;
}

/**
 * Компонент карточки пользователя
 * 
 * ЛОГИКА КАРТОЧКИ:
 * - Аватар с первой буквой имени
 * - Основная информация (имя, ID)
 * - Дополнительная информация (баллы, роль, подписка)
 * - Кнопки действий для будущего функционала
 */
interface UserCardProps {
  user: User;
  onViewUser: (user: User) => void;
}

const UserCard: React.FC<UserCardProps> = React.memo(({ user, onViewUser }) => {
  return (
    <div className="bg-[#1A1A1A] rounded-[12px] p-4 border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Аватар */}
          <div className="relative">
            <UserAvatar
              username={user.username}
              avatar_url={user.avatar_url}
              photo_url={user.photo_url}
              size="large"
            />
            
            {/* Индикатор роли */}
            
            
            {/* Индикатор подписки */}
            {/* {user.subscription && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-white" />
              </div>
            )} */}
          </div>
          
          {/* Информация о пользователе */}
          <div>
            <h3 className="text-white text-md font-montserrat font-semibold">
              @{user.username}
            </h3>
            <div className="space-y-1">
              {user.role && user.role !== 'user' && (
                <p className="text-amber-400 text-sm font-montserrat">
                  <span className="inline-flex items-center gap-1">
                    {/* <Crown className="w-3 h-3" /> */}
                    Роль: {user.role}
                  </span>
                </p>
              )}
              
              {user.subscription && (
                <p className={`text-sm font-montserrat ${
                  user.subscriptionTier?.toLowerCase().includes('premium') 
                    ? 'text-yellow-400' 
                    : 'text-purple-400'
                }`}>
                  <span className="inline-flex items-center gap-1">
                    {/* <Star className="w-3 h-3" /> */}
                    Подписка - {user.subscriptionTier}
                  </span>
                </p>
              )}
              
              {user.created_at && (
                <p className="text-[#BBBDC0] text-xs font-montserrat">
                  Регистрация: {new Date(user.created_at).toLocaleDateString('pl-PL')}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Кнопки действий */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewUser(user)}
            className="px-4 py-2 bg-[#FFFFFF] text-[#000000] text-sm font-montserrat font-bold rounded-lg transition-colors hover:bg-white/90"
            aria-label={`Просмотр профиля ${user.username}`}
          >
            Просмотр
          </button>
          
          {/* Будущие действия: редактирование, блокировка и т.д. */}
        </div>
      </div>
    </div>
  );
});

UserCard.displayName = 'UserCard';

/**
 * Компонент поиска пользователей
 * 
 * ЛОГИКА ПОИСКА:
 * - Поиск по имени пользователя
 * - Мгновенная фильтрация при вводе
 * - Очистка поиска
 */
interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
}

const SearchBar: React.FC<SearchBarProps> = React.memo(({
  searchQuery,
  onSearchChange,
  resultCount,
  totalCount
}) => {
  return (
    <div className="mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#BBBDC0]" />
        <input
          type="text"
          placeholder="Поиск пользователей..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#2A2A2A] border border-[#333333] rounded-lg text-white font-montserrat text-sm focus:outline-none focus:border-[#4F8A3E] transition-colors"
        />
      </div>
      
      {searchQuery && (
        <p className="text-[#BBBDC0] text-xs font-montserrat mt-2">
          Найдено {resultCount} из {totalCount} пользователей
        </p>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

/**
 * Основной компонент списка пользователей
 * 
 * ЛОГИКА КОМПОНЕНТА:
 * - Заголовок с общей статистикой
 * - Поиск по пользователям
 * - Список пользователей или пустое состояние
 * - Фильтрация и сортировка
 */
type SubscriptionFilter = 'all' | 'default' | 'premium' | 'no-subscription';

const UsersList: React.FC<UsersListProps> = React.memo(({ users, loading = false, onDataChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionFilter>('all');

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };
  

  // Фильтрация пользователей по поисковому запросу и типу подписки
  const filteredUsers = useMemo(() => {
    let result = users;
    
    // Фильтр по типу подписки
    if (subscriptionFilter !== 'all') {
      result = result.filter(user => {
        if (subscriptionFilter === 'no-subscription') {
          return !user.subscription;
        }
        if (subscriptionFilter === 'default') {
          const subscriptionStr = user.subscriptionTier?.toLowerCase() || '';
          return subscriptionStr.includes('default');
        }
        if (subscriptionFilter === 'premium') {
          const subscriptionStr = user.subscriptionTier?.toLowerCase() || '';
          return subscriptionStr.includes('premium');
        }
        return true;
      });
    }
    
    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.id.toString().includes(query)
      );
    }
    
    return result;
  }, [users, searchQuery, subscriptionFilter]);
  
  // Статистика по пользователям
  const userStats = useMemo(() => {
    const total = filteredUsers.length;
    const withSubscriptions = filteredUsers.filter(u => u.subscription).length;
    const defaultSubscriptions = filteredUsers.filter(u => u.subscriptionTier?.toLowerCase().includes('default')).length;
    const premiumSubscriptions = filteredUsers.filter(u => u.subscriptionTier?.toLowerCase().includes('premium')).length;
    
    return {
      total,
      withSubscriptions,
      defaultSubscriptions,
      premiumSubscriptions,
      noSubscriptions: total - withSubscriptions
    };
  }, [filteredUsers]);

  

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-montserrat font-semibold text-white mb-4">
          Управление пользователями
        </h2>
        
        {/* Загрузочная строка поиска */}
        <div className="w-full h-10 bg-gray-700 animate-pulse rounded-lg mb-4"></div>
        
        <div className="space-y-4">
          {[...Array(6)].map((_, index) => (
            <div 
              key={index}
              className="bg-[#1A1A1A] rounded-[12px] p-4 border border-[#2A2A2A] animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-600"></div>
                <div className="flex-1">
                  <div className="w-32 h-5 bg-gray-600 rounded mb-2"></div>
                  <div className="space-y-1">
                    <div className="w-20 h-3 bg-gray-600 rounded"></div>
                    <div className="w-24 h-3 bg-gray-600 rounded"></div>
                  </div>
                </div>
                <div className="w-20 h-8 bg-gray-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A] mb-6">
        {/* Заголовок по центру */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-montserrat font-semibold text-white">
            Управление пользователями
          </h2>
        </div>
        
        {/* Количество и фильтр на одной строке */}
        <div className="flex items-center justify-between">
          {/* Количество */}
          <div className="text-left flex flex-row gap-2 items-center">
            <div className="text-[#BBBDC0] text-sm">Количество:</div>
            <div className="text-white text-lg font-bold">{userStats.total}</div>
            
          </div>
          
          {/* Фильтр по типу подписки */}
          <div className="flex items-center gap-3">

            <select
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value as SubscriptionFilter)}
              className="px-3 py-2 bg-[#2A2A2A] border border-[#333333] rounded-lg text-white font-montserrat text-sm focus:outline-none focus:border-[#4F8A3E] transition-colors"
            >
              <option value="all">Все пользователи</option>
              <option value="default">Default подписки</option>
              <option value="premium">Premium подписки</option>
              <option value="no-subscription">Без подписки</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Поиск */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        resultCount={filteredUsers.length}
        totalCount={users.length}
      />
      
      {/* Список пользователей */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          {users.length === 0 ? (
            <>
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white font-montserrat font-semibold text-lg mb-2">
                Пользователей пока нет
              </h3>
              <p className="text-[#BBBDC0] font-montserrat">
                Зарегистрированные пользователи появятся здесь
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-500/20 to-gray-600/20 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-white font-montserrat font-semibold text-lg mb-2">
                Пользователи не найдены
              </h3>
              <p className="text-[#BBBDC0] font-montserrat">
                Попробуйте изменить поисковый запрос
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 px-4 py-2 bg-[#4F8A3E] hover:bg-[#5A9449] text-white font-montserrat font-medium rounded-lg transition-colors"
              >
                Очистить поиск
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} onViewUser={handleViewUser} />
          ))}
          
        </div>
      )}

      {/* Модалка просмотра пользователя */}
      <UserModal 
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDataChange={onDataChange}
      />
    </div>
  );
});


UsersList.displayName = 'UsersList';

export default UsersList;