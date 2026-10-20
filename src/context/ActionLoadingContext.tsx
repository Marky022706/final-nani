import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ActionLoadingModal } from '../components/common/modal/ActionLoadingModal';

export interface ActionLoadingOptions {
  title?: string;
  message?: string;
  useLogo?: boolean;
}

export interface WithActionLoadingOptions<T> extends ActionLoadingOptions {
  task: () => Promise<T>;
}

export interface ActionLoadingContextType {
  isActionLoading: boolean;
  showActionLoading: (options?: ActionLoadingOptions) => void;
  hideActionLoading: () => void;
  withActionLoading: <T>(options: WithActionLoadingOptions<T>) => Promise<T>;
}

const ActionLoadingContext = createContext<ActionLoadingContextType | undefined>(undefined);

export const ActionLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ActionLoadingOptions>({
    title: 'Processing Request',
    message: 'Please wait while the library system completes your request...',
    useLogo: false
  });

  const activeCountRef = useRef(0);

  const showActionLoading = useCallback((options?: ActionLoadingOptions) => {
    activeCountRef.current += 1;
    if (options) {
      const isSignIn = options.title?.toLowerCase().includes('sign') || options.title?.toLowerCase().includes('auth');
      setConfig({
        title: options.title || 'Processing Request',
        message: options.message || 'Please wait while the library system completes your request...',
        useLogo: options.useLogo !== undefined ? options.useLogo : isSignIn
      });
    }
    setIsOpen(true);
  }, []);

  const hideActionLoading = useCallback(() => {
    activeCountRef.current = Math.max(0, activeCountRef.current - 1);
    if (activeCountRef.current === 0) {
      setIsOpen(false);
    }
  }, []);

  const withActionLoading = useCallback(
    async <T,>({ task, title, message }: WithActionLoadingOptions<T>): Promise<T> => {
      showActionLoading({ title, message });
      try {
        return await task();
      } finally {
        hideActionLoading();
      }
    },
    [showActionLoading, hideActionLoading]
  );

  return (
    <ActionLoadingContext.Provider
      value={{
        isActionLoading: isOpen,
        showActionLoading,
        hideActionLoading,
        withActionLoading
      }}
    >
      {children}
      <ActionLoadingModal
        isOpen={isOpen}
        title={config.title}
        message={config.message}
        useLogo={config.useLogo}
      />
    </ActionLoadingContext.Provider>
  );
};

export const useActionLoading = (): ActionLoadingContextType => {
  const context = useContext(ActionLoadingContext);
  if (!context) {
    throw new Error('useActionLoading must be used within an ActionLoadingProvider');
  }
  return context;
};
