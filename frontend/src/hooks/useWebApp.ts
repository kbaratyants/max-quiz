import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWebApp, initWebApp, isMaxWebApp } from '../utils/webapp';

export function useWebApp() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isMaxWebApp()) {
      return;
    }

    const webApp = getWebApp();
    if (!webApp) {
      return;
    }

    // Инициализируем WebApp
    initWebApp();

    // Настраиваем кнопку "Назад"
    if (webApp.BackButton) {
      const handleBack = () => {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/');
        }
      };

      webApp.BackButton.onClick(handleBack);
      webApp.BackButton.show();

      return () => {
        webApp.BackButton?.offClick(handleBack);
        webApp.BackButton?.hide();
      };
    }
  }, [navigate]);
}

