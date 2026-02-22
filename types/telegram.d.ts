export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
            allows_write_to_pm?: boolean;
          };
          auth_date?: number;
          hash?: string;
          query_id?: string;
          start_param?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
          header_bg_color?: string;
          accent_text_color?: string;
          section_bg_color?: string;
          section_header_text_color?: string;
          subtitle_text_color?: string;
          destructive_text_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        isClosingConfirmationEnabled: boolean;
        headerColor: string;
        backgroundColor: string;
        isVerticalSwipesEnabled: boolean;
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        enableVerticalSwipes: () => void;
        disableVerticalSwipes: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id: string;
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
            text: string;
          }>;
        }, callback?: (buttonId: string) => void) => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        shareToStory: (media_url: string, params?: {
          text?: string;
          widget_link?: {
            url: string;
            name?: string;
          };
        }) => void;
        requestWriteAccess: (callback?: (granted: boolean) => void) => void;
        requestContact: (callback?: (granted: boolean, contact?: {
          contact: {
            phone_number: string;
            first_name: string;
            last_name?: string;
            user_id?: number;
          };
        }) => void) => void;
        switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setParams: (params: {
            text?: string;
            color?: string;
            text_color?: string;
            is_active?: boolean;
            is_visible?: boolean;
          }) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        SettingsButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        CloudStorage?: {
          setItem: (key: string, value: string, callback?: (error?: string) => void) => void;
          getItem: (key: string, callback: (error?: string, value?: string) => void) => void;
          getItems: (keys: string[], callback: (error?: string, values?: Record<string, string>) => void) => void;
          removeItem: (key: string, callback?: (error?: string) => void) => void;
          removeItems: (keys: string[], callback?: (error?: string) => void) => void;
          getKeys: (callback: (error?: string, keys?: string[]) => void) => void;
        };
        BiometricManager?: {
          isInited: boolean;
          isBiometricAvailable: boolean;
          biometricType: 'finger' | 'face' | 'unknown';
          isAccessRequested: boolean;
          isAccessGranted: boolean;
          isBiometricTokenSaved: boolean;
          deviceId: string;
          init: (callback?: () => void) => void;
          requestAccess: (params: { reason?: string }, callback?: (granted: boolean) => void) => void;
          authenticate: (params: { reason?: string }, callback?: (success: boolean, token?: string) => void) => void;
          updateBiometricToken: (token: string, callback?: (updated: boolean) => void) => void;
          openSettings: () => void;
        };
        LocationManager?: {
          isInited: boolean;
          isLocationAvailable: boolean;
          isAccessRequested: boolean;
          isAccessGranted: boolean;
          init: (callback?: () => void) => void;
          getLocation: (callback?: (location?: {
            latitude: number;
            longitude: number;
            altitude?: number;
            course?: number;
            speed?: number;
            horizontal_accuracy?: number;
            vertical_accuracy?: number;
          }) => void) => void;
          openSettings: () => void;
        };
        onEvent: (eventType: string, callback: (...args: unknown[]) => void) => void;
        offEvent: (eventType: string, callback: (...args: unknown[]) => void) => void;
        sendData: (data: string) => void;
        switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  allows_write_to_pm?: boolean;
}

export interface TelegramInitData {
  user?: TelegramUser;
  auth_date?: number;
  hash?: string;
  query_id?: string;
  start_param?: string;
}