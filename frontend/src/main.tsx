import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Мок для MAX WebApp (только если реальный WebApp не найден)
if (typeof window !== 'undefined' && !window.WebApp) {
  console.log('[MAX Bridge] Создаю мок WebApp для локальной отладки');
  
  // Генерируем тестовые данные пользователя
  const mockUserId = 123456789;
  const mockAuthDate = Math.floor(Date.now() / 1000);
  const mockQueryId = 'mock_query_' + Date.now();
  
  // Создаем initData строку (формат как в реальном MAX)
  const mockInitData = `query_id=${mockQueryId}&user=%7B%22id%22%3A${mockUserId}%2C%22first_name%22%3A%22Тестовый%22%2C%22last_name%22%3A%22Пользователь%22%2C%22username%22%3A%22test_user%22%7D&auth_date=${mockAuthDate}&hash=mock_hash`;
  
  // Добавляем флаг, что это мок
  (window as any).__MAX_WEBAPP_IS_MOCK__ = true;
  
  window.WebApp = {
    initData: mockInitData,
    initDataUnsafe: {
      query_id: mockQueryId,
      auth_date: mockAuthDate,
      hash: 'mock_hash',
      user: {
        id: mockUserId,
        first_name: 'Тестовый',
        last_name: 'Пользователь',
        username: 'test_user',
        language_code: 'ru',
        photo_url: undefined,
      },
      chat: undefined,
      start_param: undefined,
    },
    platform: 'web',
    version: '25.11.2',
    ready: () => {
      console.log('[mock WebApp] ready() вызван');
    },
    close: () => {
      console.log('[mock WebApp] close() вызван');
    },
    BackButton: {
      isVisible: false,
      onClick: (callback: () => void) => {
        console.log('[mock BackButton] onClick зарегистрирован');
        // В моке можно сохранить callback для тестирования
        (window as any).__mockBackButtonCallback = callback;
      },
      offClick: (_callback: () => void) => {
        console.log('[mock BackButton] offClick вызван');
        delete (window as any).__mockBackButtonCallback;
      },
      show: () => {
        console.log('[mock BackButton] show() вызван');
        if (window.WebApp?.BackButton) {
          window.WebApp.BackButton.isVisible = true;
        }
      },
      hide: () => {
        console.log('[mock BackButton] hide() вызван');
        if (window.WebApp?.BackButton) {
          window.WebApp.BackButton.isVisible = false;
        }
      },
    },
    ScreenCapture: {
      isScreenCaptureEnabled: false,
      enableScreenCapture: () => {
        console.log('[mock ScreenCapture] enableScreenCapture() вызван');
        if (window.WebApp?.ScreenCapture) {
          window.WebApp.ScreenCapture.isScreenCaptureEnabled = true;
        }
      },
      disableScreenCapture: () => {
        console.log('[mock ScreenCapture] disableScreenCapture() вызван');
        if (window.WebApp?.ScreenCapture) {
          window.WebApp.ScreenCapture.isScreenCaptureEnabled = false;
        }
      },
    },
    HapticFeedback: {
      impactOccurred: (style: string) => {
        console.log('[mock HapticFeedback] impactOccurred:', style);
      },
      notificationOccurred: (type: string) => {
        console.log('[mock HapticFeedback] notificationOccurred:', type);
      },
      selectionChanged: () => {
        console.log('[mock HapticFeedback] selectionChanged');
      },
    },
    DeviceStorage: {
      setItem: (key: string, value: string) => {
        localStorage.setItem(`max_${key}`, value);
        console.log('[mock DeviceStorage] setItem:', key, value);
      },
      getItem: (key: string) => {
        const value = localStorage.getItem(`max_${key}`);
        console.log('[mock DeviceStorage] getItem:', key, value);
        return value;
      },
      removeItem: (key: string) => {
        localStorage.removeItem(`max_${key}`);
        console.log('[mock DeviceStorage] removeItem:', key);
      },
      clear: () => {
        // Очищаем только ключи с префиксом max_
        const keys = Object.keys(localStorage).filter(k => k.startsWith('max_'));
        keys.forEach(k => localStorage.removeItem(k));
        console.log('[mock DeviceStorage] clear() вызван');
      },
    },
    openLink: (url: string) => {
      window.open(url, '_blank');
      console.log('[mock WebApp] openLink:', url);
    },
    openMaxLink: (url: string) => {
      console.log('[mock WebApp] openMaxLink:', url);
    },
      shareContent: ({ text, link }: { text: string; link: string }) => {
          if (navigator.share) {
              navigator.share({ text, url: link }).catch(() => {});
          } else {
              alert(`[mock share] ${text}\n${link}`);
          }
          console.log('[mock WebApp] shareContent:', text, link);
      },

      shareMaxContent: ({ text, link }: { text: string; link: string }) => {
          alert(`[mock shareMax] ${text}\n${link}`);
          console.log('[mock WebApp] shareMaxContent:', text, link);
      },

      openCodeReader: (fileSelect?: boolean) => {
      const code = prompt('Введите QR-код для тестирования:');
      console.log('[mock WebApp] openCodeReader:', fileSelect, code);
      return Promise.resolve(code || '');
    },
    expand: () => {
      console.log('[mock WebApp] expand() вызван');
    },
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

