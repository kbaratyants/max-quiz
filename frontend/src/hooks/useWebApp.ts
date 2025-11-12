import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWebApp, initWebApp, isMaxWebApp } from '../utils/webapp';

export function useWebApp() {
  const navigate = useNavigate();

  // Создаем стабильную функцию для обработки кнопки "Назад"
  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (!isMaxWebApp()) {
      return;
    }

    const webApp = getWebApp();
    if (!webApp || !webApp.BackButton) {
      return;
    }

    // Инициализируем WebApp только один раз
    try {
      initWebApp();
    } catch (error) {
      console.warn('[MAX Bridge] Ошибка инициализации WebApp:', error);
      return;
    }

    // Настраиваем кнопку "Назад" с обработкой ошибок
    try {
      if (typeof webApp.BackButton.onClick === 'function' && typeof webApp.BackButton.show === 'function') {
        webApp.BackButton.onClick(handleBack);
        webApp.BackButton.show();
      }
    } catch (error) {
      console.warn('[MAX Bridge] Ошибка настройки BackButton:', error);
      return;
    }

    return () => {
      try {
        if (webApp.BackButton && typeof webApp.BackButton.offClick === 'function' && typeof webApp.BackButton.hide === 'function') {
          webApp.BackButton.offClick(handleBack);
          webApp.BackButton.hide();
        }
      } catch (error) {
        console.warn('[MAX Bridge] Ошибка очистки BackButton:', error);
      }
    };
  }, [handleBack]);
}

