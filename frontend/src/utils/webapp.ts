// Типы для MAX WebApp
declare global {
  interface Window {
    WebApp?: {
      initDataUnsafe?: {
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
      shareContent?: (text: string, link: string) => void;
      shareMaxContent?: (text: string, link: string) => void;
      openCodeReader?: (fileSelect?: boolean) => Promise<string>;
      expand?: () => void;
    };
  }
}

export function getWebApp(): typeof window.WebApp | undefined {
  return window.WebApp;
}

export function isMaxWebApp(): boolean {
  return typeof window.WebApp !== 'undefined';
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

export function initWebApp() {
  const webApp = getWebApp();
  if (webApp) {
    // Сообщаем MAX, что мини-приложение готово
    webApp.ready();
    
    // Расширяем приложение на весь экран
    if (webApp.expand) {
      webApp.expand();
    }
  }
}

