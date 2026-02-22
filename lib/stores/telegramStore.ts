import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TelegramUser } from '@/types/telegram';
import toast from 'react-hot-toast';

// Безопасный тип пользователя из БД (только для отображения)
interface DatabaseUser {
  id: number;
  telegram_id: string | null;
  username: string;
  points: number | null;
  role: string;
  avatar_url: string | null;
  hasActiveSubscription: boolean; // Простая проверка для UI
}

interface TelegramStore {
  // Основные данные
  telegramUser: TelegramUser | null; // Сырые данные от Telegram
  databaseUser: DatabaseUser | null; // Проверенные данные из БД (только для отображения!)
  initData: string | null;
  isInTelegram: boolean;
  isReady: boolean;
  webApp: unknown | null;
  
  // Состояние авторизации
  isAuthenticated: boolean;
  authToken: string | null;
  isLoading: boolean;
  lastSyncTime: number;
  
  // Безопасные действия (только обновление от сервера)
  setTelegramUser: (user: TelegramUser | null) => void;
  setDatabaseUserFromServer: (user: DatabaseUser | null) => void; // Только от сервера!
  setInitData: (initData: string | null) => void;
  setIsInTelegram: (isInTelegram: boolean) => void;
  setIsReady: (isReady: boolean) => void;
  setWebApp: (webApp: unknown | null) => void;
  setAuth: (token: string, user: DatabaseUser) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  
  // Серверные действия
  initialize: () => Promise<void>;
}

export const useTelegramStore = create<TelegramStore>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      telegramUser: null,
      databaseUser: null,
      initData: null,
      isInTelegram: true,
      isReady: false,
      webApp: null,
      isAuthenticated: false,
      authToken: null,
      isLoading: false,
      lastSyncTime: 0,

      // Безопасные сеттеры
      setTelegramUser: (telegramUser) => set({ telegramUser }),
      setDatabaseUserFromServer: (databaseUser) => set({ 
        databaseUser,
        lastSyncTime: Date.now()
      }),
      setInitData: (initData) => set({ initData }),
      setIsInTelegram: (isInTelegram) => set({ isInTelegram }),
      setIsReady: (isReady) => set({ isReady }),
      setWebApp: (webApp) => set({ webApp }),
      setLoading: (isLoading) => set({ isLoading }),
      
      setAuth: (token, user) => set({ 
        authToken: token, 
        databaseUser: user,
        isAuthenticated: true,
        lastSyncTime: Date.now()
      }),
      
      logout: () => set({ 
        authToken: null, 
        isAuthenticated: false,
        databaseUser: null,
        telegramUser: null
      }),


      // Основная функция инициализации
      initialize: async () => {
        if (typeof window === 'undefined') return;

        const { 
          setTelegramUser, 
          setInitData, 
          setIsInTelegram, 
          setIsReady, 
          setWebApp,
          setLoading
        } = get();

        try {
          setLoading(true);
          
          // Проверяем, запущено ли в Telegram
          const hasTelegramWebApp = !!window.Telegram?.WebApp;
          const hasTelegramData = window.location.search.includes('tgWebAppData') || 
                                 window.location.search.includes('tgWebAppVersion');
          
          const isTelegram = hasTelegramWebApp || hasTelegramData;
          setIsInTelegram(isTelegram);

          if (isTelegram) {
            console.log('🚀 Initializing Telegram WebApp...');
            
            // Динамический импорт SDK
            const { init, retrieveLaunchParams } = await import('@telegram-apps/sdk-react');
            
            init();
            
            const params = retrieveLaunchParams();
            console.log('📱 Launch params:', params);

            if (window.Telegram?.WebApp) {
              const telegramWebApp = window.Telegram.WebApp;
              setWebApp(telegramWebApp);

              telegramWebApp.ready();
              telegramWebApp.expand();
              
              // Настройки для правильной работы с клавиатурой
              telegramWebApp.isVerticalSwipesEnabled = false;
              
              // Отключаем автоскрытие навбара при появлении клавиатуры
              if (telegramWebApp.viewportStableHeight !== undefined) {
                telegramWebApp.onEvent('viewportChanged', () => {
                  // Фиксируем навбар внизу при изменении viewport
                  const footer = document.querySelector('footer');
                  if (footer) {
                    footer.style.position = 'fixed';
                    footer.style.bottom = '0';
                  }
                });
              }

              // Получаем данные пользователя от Telegram
              const userData = telegramWebApp.initDataUnsafe?.user;
              if (userData) {
                setTelegramUser(userData);
              }

              // Получаем initData для авторизации
              const initDataString = telegramWebApp.initData;
              if (initDataString) {
                setInitData(initDataString);
                
                // Автоматически авторизуемся на сервере
                await authenticateUser(initDataString);
              }

              telegramWebApp.setBackgroundColor('#111213');
              telegramWebApp.setHeaderColor('#111213');

            }
          } else {
            console.log('🌐 Running in browser - not in Telegram environment');
          }
        } catch (error) {
          console.error('❌ Failed to initialize Telegram WebApp:', error);
          toast.error('Ошибка инициализации Telegram WebApp');
        } finally {
          setLoading(false);
          setIsReady(true);
        }
      },
    }),
    {
      name: 'telegram-store',
      storage: createJSONStorage(() => localStorage),
      // Сохраняем только безопасные данные
      partialize: (state) => ({
        databaseUser: state.databaseUser,
        isAuthenticated: state.isAuthenticated,
        authToken: state.authToken,
        lastSyncTime: state.lastSyncTime
      }),
    }
  )
);

// Функция авторизации пользователя
async function authenticateUser(initData: string) {
  try {

    // ✅ ВСЕГДА удаляем старый токен перед новой авторизацией
    const store = useTelegramStore.getState();
    if (store.authToken) {
      store.logout(); // Очищаем store
    }
    
    // Очищаем localStorage на всякий случай
    localStorage.removeItem('authToken');
    localStorage.removeItem('auth_token'); 
    localStorage.removeItem('token');
    

    const response = await fetch('/api/telegram/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    });

    const data = await response.json();

    if (data.success && data.token && data.user) {
      const user: DatabaseUser = {
        id: data.user.id,
        telegram_id: data.user.telegram_id,
        username: data.user.username,
        points: data.user.points,
        role: data.user.role,
        avatar_url: data.user.avatar_url,
        hasActiveSubscription: data.user.subscription
      };
      
      useTelegramStore.getState().setAuth(data.token, user);
      toast.success('Авторизация успешна');
    } else {
      console.error('❌ Authentication failed:', data.error);
      
      // Специальная обработка для устаревших данных
      if (data.code === 'TELEGRAM_DATA_EXPIRED') {
        toast.error('Сессия истекла. Запустите приложение заново из Telegram');
        
        // Закрываем приложение через 2 секунды
        setTimeout(() => {
          if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.close();
          }
        }, 2000);
      } else {
        toast.error(`Ошибка авторизации: ${data.error || 'Неизвестная ошибка'}`);
      }
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    toast.error('Проблемы с соединением. Проверьте интернет-подключение');
  }
}

// Селекторы для удобства
export const selectTelegramUser = (state: TelegramStore) => state.telegramUser;
export const selectDatabaseUser = (state: TelegramStore) => state.databaseUser;
export const selectIsAuthenticated = (state: TelegramStore) => state.isAuthenticated;
export const selectAuthToken = (state: TelegramStore) => state.authToken;
export const selectIsInTelegram = (state: TelegramStore) => state.isInTelegram;
export const selectIsLoading = (state: TelegramStore) => state.isLoading;