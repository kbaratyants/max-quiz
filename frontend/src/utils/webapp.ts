// Типы для MAX WebApp
declare global {
  interface Window {
    WebApp?: {
      initData?: string; // Строка с данными для валидации
      initDataUnsafe?: {
        query_id?: string;
        auth_date?: number;
        hash?: string;
        user?: {
          id: number;
          first_name?: string;
          last_name?: string;
          username?: string;
          language_code?: string;
          photo_url?: string;
        };
        chat?: {
          id: number;
          type: string;
        };
        start_param?: string;
      };
      platform?: string;
      version?: string;
      ready: () => void;
      close: () => void;
      BackButton?: {
        isVisible: boolean;
        onClick: (callback: () => void) => void;
        offClick: (callback: () => void) => void;
        show: () => void;
        hide: () => void;
      };
      ScreenCapture?: {
        isScreenCaptureEnabled: boolean;
        enableScreenCapture: () => void;
        disableScreenCapture: () => void;
      };
      HapticFeedback?: {
        impactOccurred: (style: 'soft' | 'light' | 'medium' | 'heavy' | 'rigid', disableVibrationFallback?: boolean) => void;
        notificationOccurred: (type: 'error' | 'success' | 'warning', disableVibrationFallback?: boolean) => void;
        selectionChanged: () => void;
      };
      DeviceStorage?: {
        setItem: (key: string, value: string) => void;
        getItem: (key: string) => string | null;
        removeItem: (key: string) => void;
        clear: () => void;
      };
      openLink?: (url: string) => void;
      openMaxLink?: (url: string) => void;
      shareContent?: ({ text, link }: { text: string; link: string }) => void;
      shareMaxContent?: ({ text, link }: { text: string; link: string }) => void;
      onEvent?: (eventName: string, callback: (data: any) => void) => void;
      offEvent?: (eventName: string, callback: (data: any) => void) => void;
      openCodeReader?: (fileSelect?: boolean) => Promise<string | { value: string }>;
      expand?: () => void;
    };
  }
}

export function getWebApp(): typeof window.WebApp | undefined {
  return window.WebApp;
}

export function isMaxWebApp(): boolean {
  // Проверяем не только наличие объекта, но и что это реальный MAX WebApp
  if (typeof window === 'undefined' || typeof window.WebApp === 'undefined') {
    return false;
  }
  
  // Проверяем, что это не наш мок
  if ((window as any).__MAX_WEBAPP_IS_MOCK__) {
    return false;
  }
  
  // Дополнительная проверка: в реальном MAX WebApp должен быть метод ready
  const webApp = window.WebApp;
  return typeof webApp === 'object' && typeof webApp.ready === 'function';
}

export function getUserIdFromWebApp(): string | null {
  const webApp = getWebApp();
  if (webApp?.initDataUnsafe?.user?.id) {
    return String(webApp.initDataUnsafe.user.id);
  }
  return null;
}

export function getUserInfoFromWebApp() {
  const webApp = getWebApp();
  if (webApp?.initDataUnsafe?.user) {
    return {
      id: String(webApp.initDataUnsafe.user.id),
      firstName: webApp.initDataUnsafe.user.first_name,
      lastName: webApp.initDataUnsafe.user.last_name,
      username: webApp.initDataUnsafe.user.username,
      photoUrl: webApp.initDataUnsafe.user.photo_url,
    };
  }
  return null;
}

export function getInitData(): string | null {
  const webApp = getWebApp();
  // initData - это строка с данными для валидации на бэкенде
  if (webApp?.initData) {
    return webApp.initData;
  }
  return null;
}

export function getInitDataUnsafe() {
  const webApp = getWebApp();
  return webApp?.initDataUnsafe || null;
}

export function getStartParam(): string | null {
  const webApp = getWebApp();
  // start_param приходит в initDataUnsafe при запуске через startapp=...
  if (webApp?.initDataUnsafe?.start_param) {
    return webApp.initDataUnsafe.start_param;
  }
  return null;
}

let isInitialized = false;

export function initWebApp() {
  // Защита от повторной инициализации
  if (isInitialized) {
    return;
  }

  const webApp = getWebApp();
  if (webApp && typeof webApp.ready === 'function') {
    try {
      // Сообщаем MAX, что мини-приложение готово
      webApp.ready();
      
      // Расширяем приложение на весь экран
      if (typeof webApp.expand === 'function') {
        webApp.expand();
      }
      
      isInitialized = true;
    } catch (error) {
      console.warn('[MAX Bridge] Ошибка инициализации WebApp:', error);
    }
  }
}

