import { createContext, useContext, ReactNode } from 'react';
import { useToast, Toast } from '../hooks/useToast';
import ToastComponent from '../components/Toast';

interface ToastContextType {
  success: (message: string, duration?: number) => number;
  error: (message: string, duration?: number) => number;
  info: (message: string, duration?: number) => number;
  warning: (message: string, duration?: number) => number;
  toasts: Toast[];
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-wrapper">
        {toast.toasts.map((toastItem, index) => (
          <div
            key={toastItem.id}
            style={{
              position: 'fixed',
              top: `${20 + index * 80}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10000 + index,
            }}
          >
            <ToastComponent
              message={toastItem.message}
              type={toastItem.type}
              duration={toastItem.duration}
              onClose={() => toast.removeToast(toastItem.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}

