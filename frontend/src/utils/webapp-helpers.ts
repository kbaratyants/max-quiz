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

export function openCodeReader(fileSelect: boolean = true): Promise<string> {
  const webApp = getWebApp();
  
  if (isMaxWebApp() && webApp?.openCodeReader) {
    hapticFeedbackInternal('impact', 'light');
    return webApp.openCodeReader(fileSelect)
      .then((result) => {
        if (result && result.trim()) {
          hapticFeedbackInternal('notification', 'success');
          return result.trim();
        }
        throw new Error('QR код не распознан или пуст');
      })
      .catch((error: any) => {
        // Обработка различных типов ошибок
        if (error?.code === 'client.open_code_reader.cancelled') {
          throw new Error('Сканирование отменено');
        } else if (error?.code === 'client.open_code_reader.permission_denied') {
          throw new Error('Нет доступа к камере');
        } else if (error?.code === 'client.open_code_reader.not_supported') {
          throw new Error('Камера не поддерживается на этом устройстве');
        }
        hapticFeedbackInternal('notification', 'error');
        throw error;
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

