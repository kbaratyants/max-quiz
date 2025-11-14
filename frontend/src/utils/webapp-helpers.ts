import { getWebApp, isMaxWebApp as checkMaxWebApp } from './webapp';

// Флаг для включения/выключения дебага (можно изменить на true для включения)
const DEBUG_ENABLED = true; // Временно включен для диагностики

// Тип для функции показа тоста (опционально)
type ToastFunction = ((message: string, type?: 'success' | 'error' | 'warning' | 'info') => void) | null;

// Глобальная переменная для хранения toast функции
let debugToast: ToastFunction = null;

/**
 * Устанавливает функцию для показа дебаг-тостов
 */
export function setDebugToast(toast: ToastFunction) {
  debugToast = toast;
}

/**
 * Показывает дебаг-сообщение (тост или console.log)
 */
function debugLog(message: string, type: 'info' | 'error' = 'info', showToast: boolean = false) {
  // Всегда логируем в консоль
  if (type === 'error') {
    console.error('[DEBUG]', message);
  } else {
    console.log('[DEBUG]', message);
  }
  
  // Тосты показываем только если явно указано или это ошибка
  if (DEBUG_ENABLED && (showToast || type === 'error') && debugToast) {
    debugToast(message, type);
  }
}

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
  debugLog(`shareContent: text="${text}", link="${link}"`);
  const webApp = getWebApp();
  
  // Проверяем ограничения MAX API: максимум 200 символов для text и link
  const MAX_LENGTH = 200;
  // Убеждаемся, что параметры - строки (не null/undefined)
  const safeText = (text || '').toString();
  const safeLink = (link || '').toString();
  const truncatedText = safeText.length > MAX_LENGTH ? safeText.substring(0, MAX_LENGTH) : safeText;
  const truncatedLink = safeLink.length > MAX_LENGTH ? safeLink.substring(0, MAX_LENGTH) : safeLink;
  
  // Проверяем, что хотя бы один параметр не пустой (требование MAX API)
  if (!truncatedText.trim() && !truncatedLink.trim()) {
    debugLog('shareContent: Оба параметра пустые', 'error', true);
    return false;
  }
  
  if (isMaxWebApp() && webApp?.shareContent) {
    // Согласно документации MAX Bridge, shareContent тоже работает через события
    let shareHandler: ((eventData: any) => void) | null = null;
    let isHandled = false;
    
    try {
      // Подписываемся на событие перед вызовом
      if (webApp.onEvent) {
        debugLog(`shareContent: Подписываемся на событие WebAppShare`);
        shareHandler = (eventData: any) => {
          debugLog(`shareContent: Событие получено! Данные: ${JSON.stringify(eventData)}`);
          
          if (isHandled) {
            debugLog(`shareContent: Событие уже обработано, игнорируем`);
            return;
          }
          
          isHandled = true;
          
          // Отписываемся от события после получения результата
          if (webApp?.offEvent && shareHandler) {
            debugLog(`shareContent: Отписываемся от события`);
            webApp.offEvent('WebAppShare', shareHandler);
          }
          
          if (eventData.status === 'shared') {
            hapticFeedbackInternal('notification', 'success');
            debugLog('shareContent: Успешно поделились!', 'info', true);
          } else if (eventData.status === 'cancelled') {
            debugLog('shareContent: Пользователь отменил шаринг', 'info', true);
          } else if (eventData.error) {
            const errorCode = eventData.error.code || eventData.error;
            debugLog(`shareContent: Ошибка шаринга: ${errorCode}`, 'error', true);
          } else {
            debugLog(`shareContent: Неизвестный формат ответа: ${JSON.stringify(eventData)}`, 'error', true);
          }
        };
        
        webApp.onEvent('WebAppShare', shareHandler);
        debugLog(`shareContent: Подписка на событие выполнена`);
      } else {
        debugLog(`shareContent: webApp.onEvent не доступен, события не поддерживаются`, 'error', true);
      }
      
      // Передаем оба параметра как строки
      debugLog(`shareContent: Вызываем метод с text="${truncatedText}", link="${truncatedLink}"`);
      webApp.shareContent(truncatedText, truncatedLink);
      
      debugLog('shareContent: Вызов выполнен, ждем результат через событие', 'info', true);
      
      // Таймаут для отладки - если событие не придет за 5 секунд, покажем предупреждение
      setTimeout(() => {
        if (!isHandled) {
          debugLog('shareContent: Событие не получено за 5 секунд. Возможно, события не работают или метод работает синхронно.', 'error', true);
        }
      }, 5000);
      
      return true;
    } catch (error: any) {
      debugLog(`shareContent: Ошибка при вызове webApp.shareContent - ${error?.message || error}`, 'error', true);
      // Отписываемся при ошибке
      if (webApp?.offEvent && shareHandler) {
        webApp.offEvent('WebAppShare', shareHandler);
      }
      return false;
    }
  }
  
  // Fallback на Web Share API
  if (navigator.share) {
    navigator.share({ text: truncatedText, url: truncatedLink }).catch((error: any) => {
      debugLog(`shareContent: Ошибка navigator.share - ${error?.message || error}`, 'error');
    });
    return true;
  }
  
  debugLog('shareContent: Ни один метод не доступен', 'error', true);
  return false;
}

export function shareMaxContent(text: string, link: string) {
  debugLog(`shareMaxContent: Входные параметры - text="${text}", link="${link}"`);
  const webApp = getWebApp();
  
  if (!isMaxWebApp()) {
    debugLog('shareMaxContent: Не в MAX WebApp, метод недоступен', 'error', true);
    return false;
  }
  
  if (!webApp) {
    debugLog('shareMaxContent: webApp не найден', 'error', true);
    return false;
  }
  
  // Проверяем ограничения MAX API: максимум 200 символов для text и link
  const MAX_LENGTH = 200;
  // Убеждаемся, что параметры - строки (не null/undefined)
  const safeText = (text || '').toString().trim();
  const safeLink = (link || '').toString().trim();
  const truncatedText = safeText.length > MAX_LENGTH ? safeText.substring(0, MAX_LENGTH) : safeText;
  const truncatedLink = safeLink.length > MAX_LENGTH ? safeLink.substring(0, MAX_LENGTH) : safeLink;
  
  debugLog(`shareMaxContent: Обработанные параметры - text="${truncatedText}" (${truncatedText.length} символов), link="${truncatedLink}" (${truncatedLink.length} символов)`);
  
  // Согласно документации, оба параметра должны быть переданы и не пустые
  // Если один из параметров пустой, используем другой для обоих, чтобы оба были не пустыми
  let finalText = truncatedText;
  let finalLink = truncatedLink;
  
  // Если text пустой, используем link для обоих
  if (!finalText && finalLink) {
    finalText = finalLink;
    debugLog(`shareMaxContent: text пустой, используем link для обоих параметров`);
  }
  
  // Если link пустой, используем text для обоих
  if (!finalLink && finalText) {
    finalLink = finalText;
    debugLog(`shareMaxContent: link пустой, используем text для обоих параметров`);
  }
  
  // Проверяем, что оба параметра теперь не пустые
  if (!finalText || !finalLink) {
    debugLog('shareMaxContent: Не удалось заполнить оба параметра', 'error', true);
    return false;
  }
  
  debugLog(`shareMaxContent: Финальные параметры (оба не пустые) - text="${finalText}" (${finalText.length} символов), link="${finalLink}" (${finalLink.length} символов)`);
  
  if (!webApp.shareMaxContent) {
    debugLog(`shareMaxContent: webApp.shareMaxContent не найден. Доступные методы: ${Object.keys(webApp).join(', ')}`, 'error', true);
    return false;
  }
  
  // Согласно документации MAX Bridge, shareMaxContent работает через события
  // Но если события не приходят, пробуем разные варианты синхронно
  let shareHandler: ((eventData: any) => void) | null = null;
  
  // Подписываемся на событие один раз для всех вариантов (если поддерживается)
  if (webApp.onEvent) {
    shareHandler = (eventData: any) => {
      debugLog(`shareMaxContent: Событие получено! Данные: ${JSON.stringify(eventData)}`);
      
      if (eventData.status === 'shared') {
        hapticFeedbackInternal('notification', 'success');
        debugLog('shareMaxContent: Успешно поделились!', 'info', true);
      } else if (eventData.status === 'cancelled') {
        debugLog('shareMaxContent: Пользователь отменил шаринг', 'info');
      } else if (eventData.error) {
        const errorCode = eventData.error.code || eventData.error;
        debugLog(`shareMaxContent: Ошибка шаринга: ${errorCode}`, 'error', true);
      }
    };
    webApp.onEvent('WebAppMaxShare', shareHandler);
    debugLog('shareMaxContent: Подписка на событие выполнена');
  }
  
  // Пробуем разные варианты передачи параметров последовательно
  const variants = [
    { text: finalText, link: finalLink, name: '1 (оба параметра: text + link)' },
    { text: finalLink, link: finalText, name: '2 (link в text, text в link)' },
    { text: finalText, link: finalText, name: '3 (text в обоих параметрах)' },
    { text: finalLink, link: finalLink, name: '4 (link в обоих параметрах)' },
  ];
  
  // Пробуем варианты последовательно
  for (const variant of variants) {
    try {
      debugLog(`shareMaxContent: Пробуем вариант ${variant.name} - text="${variant.text}", link="${variant.link}"`);
      webApp.shareMaxContent(variant.text, variant.link);
      debugLog(`shareMaxContent: Вызов выполнен без исключения (${variant.name})`, 'info', true);
      
      // Если метод не выбросил исключение, считаем что вызов успешен
      // Событие может прийти позже, но мы не ждем его
      return true;
    } catch (error: any) {
      debugLog(`shareMaxContent: Вариант ${variant.name} выбросил исключение: ${error?.message || error}`, 'error');
      // Продолжаем пробовать следующий вариант
    }
  }
  
  // Если все варианты выбросили исключение
  if (webApp?.offEvent && shareHandler) {
    webApp.offEvent('WebAppMaxShare', shareHandler);
  }
  
  debugLog('shareMaxContent: Все варианты выбросили исключение', 'error', true);
  return false;
}

/**
 * Извлекает quizId из QR-кода (может быть URL или прямой ID/shortId)
 * @param qrResult - Результат сканирования QR-кода
 * @returns quizId/shortId или null, если не удалось распознать
 */
export function extractQuizIdFromQR(qrResult: string): string | null {
  if (!qrResult || !qrResult.trim()) {
    return null;
  }

  const trimmed = qrResult.trim();

  // Извлекаем quizId/shortId из URL если это ссылка
  // Поддерживаем разные форматы: /survey/, /quiz/, /quizzes/
  const match = trimmed.match(/(?:survey|quiz|quizzes)\/([a-zA-Z0-9_-]+)/i);
  if (match) {
    return match[1];
  }

  // Прямой ID/shortId - проверяем формат перед использованием
  // shortId обычно короткий (8 символов), но может быть и длиннее
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

