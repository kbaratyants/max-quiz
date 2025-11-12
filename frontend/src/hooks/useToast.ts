import { useState, useCallback } from 'react';
import { ToastProps } from '../components/Toast';

export interface Toast extends Omit<ToastProps, 'onClose'> {
  id: number;
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastProps['type'] = 'info', duration?: number) => {
    // Дедупликация: не показываем тост, если уже есть активный тост с таким же сообщением и типом
    setToasts((prev) => {
      const isDuplicate = prev.some(
        (toast) => toast.message === message && toast.type === type
      );
      if (isDuplicate) {
        return prev;
      }
      
      const id = toastId++;
      const newToast: Toast = { id, message, type, duration };
      return [...prev, newToast];
    });
    
    return toastId - 1;
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
}

