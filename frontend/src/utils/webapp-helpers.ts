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
function debugLog(message: string, type: 'info' | 'error' = 'info') {
  if (!DEBUG_ENABLED) return;
  
  if (debugToast) {
    debugToast(message, type);
  } else {
    if (type === 'error') {
      console.error('[DEBUG]', message);
    } else {
      console.log('[DEBUG]', message);
    }
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
  debugLog(`shareContent: webApp=${!!webApp}, isMaxWebApp=${isMaxWebApp()}`);
  
  // Проверяем ограничения MAX API: максимум 200 символов для text и link
  const MAX_LENGTH = 200;
  // Убеждаемся, что параметры - строки (не null/undefined)
  const safeText = (text || '').toString();
  const safeLink = (link || '').toString();
  const truncatedText = safeText.length > MAX_LENGTH ? safeText.substring(0, MAX_LENGTH) : safeText;
  const truncatedLink = safeLink.length > MAX_LENGTH ? safeLink.substring(0, MAX_LENGTH) : safeLink;
  
  // Проверяем, что хотя бы один параметр не пустой (требование MAX API)
  if (!truncatedText.trim() && !truncatedLink.trim()) {
    debugLog('shareContent: Оба параметра пустые', 'error');
    return false;
  }
  
  debugLog(`shareContent: Усеченные параметры - text="${truncatedText}" (${truncatedText.length}), link="${truncatedLink}" (${truncatedLink.length})`);
  
  if (isMaxWebApp() && webApp?.shareContent) {
    debugLog('shareContent: Вызываем webApp.shareContent');
    try {
      // Передаем оба параметра как строки (даже если один пустой)
      webApp.shareContent(truncatedText, truncatedLink);
      hapticFeedbackInternal('notification', 'success');
      debugLog('shareContent: Успешно вызван webApp.shareContent');
      return true;
    } catch (error: any) {
      debugLog(`shareContent: Ошибка при вызове webApp.shareContent - ${error?.message || error}`, 'error');
      return false;
    }
  }
  
  // Fallback на Web Share API
  if (navigator.share) {
    debugLog('shareContent: Используем navigator.share');
    navigator.share({ text: truncatedText, url: truncatedLink }).catch((error: any) => {
      debugLog(`shareContent: Ошибка navigator.share - ${error?.message || error}`, 'error');
    });
    return true;
  }
  
  debugLog('shareContent: Ни один метод не доступен');
  return false;
}

export function shareMaxContent(text: string, link: string) {
  debugLog(`shareMaxContent: text="${text}", link="${link}"`);
  const webApp = getWebApp();
  debugLog(`shareMaxContent: webApp=${!!webApp}, isMaxWebApp=${isMaxWebApp()}, hasShareMaxContent=${!!webApp?.shareMaxContent}`);
  
  // Проверяем ограничения MAX API: максимум 200 символов для text и link
  const MAX_LENGTH = 200;
  // Убеждаемся, что параметры - строки (не null/undefined)
  const safeText = (text || '').toString();
  const safeLink = (link || '').toString();
  const truncatedText = safeText.length > MAX_LENGTH ? safeText.substring(0, MAX_LENGTH) : safeText;
  const truncatedLink = safeLink.length > MAX_LENGTH ? safeLink.substring(0, MAX_LENGTH) : safeLink;
  
  // Проверяем, что хотя бы один параметр не пустой (требование MAX API)
  if (!truncatedText.trim() && !truncatedLink.trim()) {
    debugLog('shareMaxContent: Оба параметра пустые', 'error');
    return false;
  }
  
  debugLog(`shareMaxContent: Усеченные параметры - text="${truncatedText}" (${truncatedText.length}), link="${truncatedLink}" (${truncatedLink.length})`);
  debugLog(`shareMaxContent: typeof webApp=${typeof webApp}, typeof shareMaxContent=${typeof webApp?.shareMaxContent}`);
  
  if (!isMaxWebApp()) {
    debugLog('shareMaxContent: Не в MAX WebApp, метод недоступен', 'error');
    return false;
  }
  
  if (!webApp) {
    debugLog('shareMaxContent: webApp не найден', 'error');
    return false;
  }
  
  if (!webApp.shareMaxContent) {
    debugLog(`shareMaxContent: webApp.shareMaxContent не найден. Доступные методы: ${Object.keys(webApp).join(', ')}`, 'error');
    return false;
  }
  
  debugLog('shareMaxContent: Вызываем webApp.shareMaxContent');
  try {
    // Передаем оба параметра как строки (даже если один пустой)
    webApp.shareMaxContent(truncatedText, truncatedLink);
    hapticFeedbackInternal('notification', 'success');
    debugLog('shareMaxContent: Успешно вызван webApp.shareMaxContent');
    return true;
  } catch (error: any) {
    debugLog(`shareMaxContent: Ошибка при вызове webApp.shareMaxContent - ${error?.message || error}`, 'error');
    debugLog(`shareMaxContent: Стек ошибки: ${error?.stack || 'нет стека'}`, 'error');
    return false;
  }
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

