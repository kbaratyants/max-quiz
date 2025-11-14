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
        webApp.HapticFeedback.impactOccurred(style as any);
    } else if (type === 'notification' && style && ['error', 'success', 'warning'].includes(style)) {
        webApp.HapticFeedback.notificationOccurred(style as any);
    } else if (type === 'selection') {
        webApp.HapticFeedback.selectionChanged();
    }
}

export function copyToClipboard(text: string): Promise<void> {
    const webApp = getWebApp();

    if (isMaxWebApp() && webApp) {
        return navigator.clipboard.writeText(text).then(() => {
            hapticFeedbackInternal('notification', 'success');
        });
    }

    return navigator.clipboard.writeText(text);
}

export function shareContent(params: { text: string; link: string }): boolean {
    const { text, link } = params || {};
    const webApp = getWebApp();

    const MAX_LENGTH = 200;
    const safeText = (text || '').toString();
    const safeLink = (link || '').toString();

    const truncatedText =
        safeText.length > MAX_LENGTH ? safeText.substring(0, MAX_LENGTH) : safeText;

    const truncatedLink =
        safeLink.length > MAX_LENGTH ? safeLink.substring(0, MAX_LENGTH) : safeLink;

    if (!truncatedText.trim() && !truncatedLink.trim()) {
        return false;
    }

    if (isMaxWebApp() && webApp?.shareContent) {
        let shareHandler: ((eventData: any) => void) | null = null;

        try {
            if (webApp.onEvent) {
                shareHandler = (eventData: any) => {
                    if (webApp?.offEvent && shareHandler) {
                        webApp.offEvent('WebAppShare', shareHandler);
                    }

                    if (eventData?.status === 'shared') {
                        hapticFeedbackInternal('notification', 'success');
                    }
                };

                webApp.onEvent('WebAppShare', shareHandler);
            }

            webApp.shareContent({
                text: truncatedText,
                link: truncatedLink,
            });

            return true;
        } catch {
            if (webApp?.offEvent && shareHandler) {
                webApp.offEvent('WebAppShare', shareHandler);
            }
            return false;
        }
    }

    if (navigator.share) {
        navigator.share({ text: truncatedText, url: truncatedLink }).catch(() => {});
        return true;
    }

    return false;
}

export function shareMaxContent(params: { text: string; link: string }): boolean {
    const { text, link } = params || {};
    const webApp = getWebApp();

    if (!isMaxWebApp() || !webApp) return false;

    const MAX_LENGTH = 200;
    const safeText = (text || '').toString().trim();
    const safeLink = (link || '').toString().trim();

    const truncatedText =
        safeText.length > MAX_LENGTH ? safeText.substring(0, MAX_LENGTH) : safeText;

    const truncatedLink =
        safeLink.length > MAX_LENGTH ? safeLink.substring(0, MAX_LENGTH) : safeLink;

    let finalText = truncatedText;
    let finalLink = truncatedLink;

    if (!finalText && finalLink) finalText = finalLink;
    if (!finalLink && finalText) finalLink = finalText;
    if (!finalText || !finalLink) return false;

    let shareHandler: ((eventData: any) => void) | null = null;

    if (webApp.onEvent) {
        shareHandler = (eventData: any) => {
            if (eventData?.status === 'shared') {
                hapticFeedbackInternal('notification', 'success');
            }
        };
        webApp.onEvent('WebAppMaxShare', shareHandler);
    }

    try {
        webApp?.shareMaxContent?.({ text: finalText, link: finalLink });
    } catch {
        // ignore
    } finally {
        if (webApp?.offEvent && shareHandler) {
            try {
                webApp.offEvent('WebAppMaxShare', shareHandler);
            } catch {}
        }
    }

    return true;
}

export function extractQuizIdFromQR(qrResult: string): string | null {
    if (!qrResult || !qrResult.trim()) {
        return null;
    }

    const trimmed = qrResult.trim();

    const match = trimmed.match(/(?:survey|quiz|quizzes)\/([a-zA-Z0-9_-]+)/i);
    if (match) {
        return match[1];
    }

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
                let value: string;

                if (typeof result === 'string') {
                    value = result;
                } else if (result && typeof result === 'object' && 'value' in result) {
                    value = (result as any).value;
                } else {
                    throw new Error(`QR code parsing error: ${JSON.stringify(result)}`);
                }

                const trimmedValue = value.trim();
                if (trimmedValue) {
                    hapticFeedbackInternal('notification', 'success');
                    return trimmedValue;
                }

                throw new Error(`QR empty: ${JSON.stringify(value)}`);
            })
            .catch((error: any) => {
                if (error?.code === 'client.open_code_reader.cancelled') {
                    throw new Error('Сканирование отменено');
                } else if (error?.code === 'client.open_code_reader.permission_denied') {
                    throw new Error('Нет доступа к камере');
                } else if (error?.code === 'client.open_code_reader.not_supported') {
                    throw new Error('Камера не поддерживается');
                }

                throw new Error(error?.message || 'QR Reader Error');
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
