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

export function debugWebApp() {
  const webApp = getWebApp();
  
  console.group('🔍 MAX WebApp Debug Info');
  
  if (!webApp) {
    console.warn('❌ WebApp не найден. Библиотека MAX не подключена или не загрузилась.');
    console.groupEnd();
    return false;
  }
  
  console.log('✅ WebApp найден');
  console.log('📱 Платформа:', webApp.platform || 'не указана');
  console.log('📦 Версия MAX:', webApp.version || 'не указана');
  
  // Проверяем initData
  if (webApp.initData) {
    console.log('✅ initData доступен (строка):', webApp.initData.substring(0, 50) + '...');
  } else {
    console.warn('⚠️ initData не найден');
  }
  
  // Проверяем initDataUnsafe
  if (webApp.initDataUnsafe) {
    console.log('✅ initDataUnsafe доступен');
    
    if (webApp.initDataUnsafe.user) {
      console.log('👤 Пользователь:', {
        id: webApp.initDataUnsafe.user.id,
        name: `${webApp.initDataUnsafe.user.first_name || ''} ${webApp.initDataUnsafe.user.last_name || ''}`.trim(),
        username: webApp.initDataUnsafe.user.username,
      });
    } else {
      console.warn('⚠️ Данные пользователя не найдены');
    }
    
    if (webApp.initDataUnsafe.chat) {
      console.log('💬 Чат:', {
        id: webApp.initDataUnsafe.chat.id,
        type: webApp.initDataUnsafe.chat.type,
      });
    }
    
    if (webApp.initDataUnsafe.hash) {
      console.log('🔐 Hash доступен:', webApp.initDataUnsafe.hash.substring(0, 20) + '...');
    }
    
    if (webApp.initDataUnsafe.query_id) {
      console.log('🆔 Query ID:', webApp.initDataUnsafe.query_id);
    }
    
    if (webApp.initDataUnsafe.auth_date) {
      const date = new Date(webApp.initDataUnsafe.auth_date * 1000);
      console.log('📅 Auth Date:', date.toLocaleString('ru-RU'));
    }
  } else {
    console.warn('⚠️ initDataUnsafe не найден');
  }
  
  // Проверяем доступные методы
  const availableMethods = [];
  if (typeof webApp.ready === 'function') availableMethods.push('ready');
  if (typeof webApp.close === 'function') availableMethods.push('close');
  if (webApp.BackButton) availableMethods.push('BackButton');
  if (webApp.ScreenCapture) availableMethods.push('ScreenCapture');
  if (webApp.HapticFeedback) availableMethods.push('HapticFeedback');
  if (webApp.DeviceStorage) availableMethods.push('DeviceStorage');
  if (typeof webApp.openCodeReader === 'function') availableMethods.push('openCodeReader');
  if (typeof webApp.shareContent === 'function') availableMethods.push('shareContent');
  if (typeof webApp.shareMaxContent === 'function') availableMethods.push('shareMaxContent');
  
  console.log('🛠️ Доступные методы:', availableMethods.join(', ') || 'нет');
  
  console.groupEnd();
  
  return true;
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

