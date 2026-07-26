import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  tone: ToastTone;
  title: string;
  description?: string;
}

export interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
