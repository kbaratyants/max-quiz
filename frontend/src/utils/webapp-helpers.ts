import { getWebApp, isMaxWebApp as checkMaxWebApp } from './webapp';

export function isMaxWebApp(): boolean {
  return checkMaxWebApp();
}

function hapticFeedbackInternal(
  type: 'impact' | 'notification' | 'selection',
  style?: 'soft' | 'light' | 'medium' | 'heavy' | 'rigid' | 'error' | 'success' | 'warning'
) {
  const webApp = getWebApp();
  
  if (!isMaxWebApp() || !webApp?.HapticFeedback) {
    return;
  }
  
  if (type === 'impact' && style && ['soft', 'light', 'medium', 'heavy', 'rigid'].includes(style)) {
    webApp.HapticFeedback.impactOccurred(style as 'soft' | 'light' | 'medium' | 'heavy' | 'rigid');
  } else if (type === 'notification' && style && ['error', 'success', 'warning'].includes(style)) {
    webApp.HapticFeedback.notificationOccurred(style as 'error' | 'success' | 'warning');
  } else if (type === 'selection') {
    webApp.HapticFeedback.selectionChanged();
  }
}

export function copyToClipboard(text: string): Promise<void> {
  const webApp = getWebApp();
  
  // В MAX можно использовать нативный метод, если доступен
  if (isMaxWebApp() && webApp) {
    // Пока используем стандартный способ
    return navigator.clipboard.writeText(text).then(() => {
      hapticFeedbackInternal('notification', 'success');
    });
  }
  
  return navigator.clipboard.writeText(text);
}

export function shareContent(text: string, link: string) {
  const webApp = getWebApp();
  
  if (isMaxWebApp() && webApp?.shareContent) {
    webApp.shareContent(text, link);
    hapticFeedbackInternal('notification', 'success');
    return true;
  }
  
  // Fallback на Web Share API
  if (navigator.share) {
    navigator.share({ text, url: link }).catch(() => {});
    return true;
  }
  
  return false;
}

export function shareMaxContent(text: string, link: string) {
  const webApp = getWebApp();
  
  if (isMaxWebApp() && webApp?.shareMaxContent) {
    webApp.shareMaxContent(text, link);
    hapticFeedbackInternal('notification', 'success');
    return true;
  }
  
  return false;
}

/**
 * Извлекает quizId из QR-кода (может быть URL или прямой ID)
 * @param qrResult - Результат сканирования QR-кода
 * @returns quizId или null, если не удалось распознать
 */
export function extractQuizIdFromQR(qrResult: string): string | null {
  if (!qrResult || !qrResult.trim()) {
    return null;
  }

  const trimmed = qrResult.trim();

  // Извлекаем quizId из URL если это ссылка
  // Поддерживаем разные форматы: /survey/, /quiz/, /quizzes/
  const match = trimmed.match(/(?:survey|quiz|quizzes)\/([a-zA-Z0-9_-]+)/i);
  if (match) {
    return match[1];
  }

  // Прямой ID - проверяем формат перед использованием
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function openCodeReader(fileSelect: boolean = true): Promise<string> {
  const webApp = getWebApp();
  
  if (isMaxWebApp() && webApp?.openCodeReader) {
    hapticFeedbackInternal('impact', 'light');
    return webApp.openCodeReader(fileSelect)
      .then((result) => {
        // Логируем что пришло для отладки
        console.log('[QR Reader] Получен результат:', result);
        console.log('[QR Reader] Тип результата:', typeof result);
        console.log('[QR Reader] Результат как JSON:', JSON.stringify(result, null, 2));
        
        // MAX может вернуть либо строку, либо объект { value: string }
        let value: string;
        if (typeof result === 'string') {
          value = result;
        } else if (result && typeof result === 'object' && 'value' in result && typeof result.value === 'string') {
          value = result.value;
        } else {
          // Выводим детальную информацию об ошибке
          const errorMsg = `QR код не распознан. Получено: ${JSON.stringify(result)} (тип: ${typeof result})`;
          console.error('[QR Reader] Ошибка парсинга:', errorMsg);
          throw new Error(errorMsg);
        }
        
        const trimmedValue = value.trim();
        if (trimmedValue) {
          hapticFeedbackInternal('notification', 'success');
          return trimmedValue;
        }
        throw new Error(`QR код пуст. Исходное значение: ${JSON.stringify(value)}`);
      })
      .catch((error: any) => {
        // Логируем полную информацию об ошибке
        console.error('[QR Reader] Ошибка:', error);
        console.error('[QR Reader] Тип ошибки:', typeof error);
        console.error('[QR Reader] Ошибка как JSON:', JSON.stringify(error, null, 2));
        console.error('[QR Reader] Ключи ошибки:', error ? Object.keys(error) : 'нет');
        
        // Обработка различных типов ошибок
        if (error?.code === 'client.open_code_reader.cancelled') {
          throw new Error('Сканирование отменено');
        } else if (error?.code === 'client.open_code_reader.permission_denied') {
          throw new Error('Нет доступа к камере');
        } else if (error?.code === 'client.open_code_reader.not_supported') {
          throw new Error('Камера не поддерживается на этом устройстве');
        }
        
        // Выводим детальную информацию об ошибке
        const errorDetails = JSON.stringify(error, null, 2);
        const errorMessage = error?.message || error?.toString() || 'Неизвестная ошибка';
        hapticFeedbackInternal('notification', 'error');
        throw new Error(`${errorMessage}\n\nДетали:\n${errorDetails}`);
      });
  }
  
  return Promise.reject(new Error('QR code reader not available'));
}

export function hapticFeedback(
  type: 'impact' | 'notification' | 'selection',
  style?: 'soft' | 'light' | 'medium' | 'heavy' | 'rigid' | 'error' | 'success' | 'warning'
) {
  hapticFeedbackInternal(type, style);
}

export function enableScreenCaptureProtection() {
  const webApp = getWebApp();
  
  if (isMaxWebApp() && webApp?.ScreenCapture) {
    webApp.ScreenCapture.enableScreenCapture();
  }
}

export function disableScreenCaptureProtection() {
  const webApp = getWebApp();
  
  if (isMaxWebApp() && webApp?.ScreenCapture) {
    webApp.ScreenCapture.disableScreenCapture();
  }
}

